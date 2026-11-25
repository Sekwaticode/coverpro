import { createClerkClient } from "@clerk/backend";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../database/client.js";
import {
  contracts,
  conversation_participants,
  conversations,
  service_bookings,
  service_listings,
  tradesafe_transactions,
} from "../../database/schema.js";
import { sendNotification } from "../../events/publisher.js";
import { ApiError } from "../../utils/api-error.js";
import type { ListingMilestone } from "../../database/schema.js";
import { getListingOwners } from "../listings/listings.service.js";
import type { ListingOwner } from "../listings/listings.owner.js";
import { sendMessage } from "../messaging/messaging.service.js";
import { getClientTradeSafeToken } from "../contracts/contracts.service.js";
import {
  createEscrowTransaction,
  getCheckoutLink,
  getPlatformToken,
} from "../tradesafe/tradesafe.api.js";
import { getSellerToken, hasPayoutDetails } from "../tradesafe/tradesafe.payouts.js";
import { PLATFORM_FEE_RATE } from "../../config/constants.js";

type BookingRow = typeof service_bookings.$inferSelect;
type ListingRow = typeof service_listings.$inferSelect;

export type BookingStatus = "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "PAID";
const OPEN_STATUSES: BookingStatus[] = ["REQUESTED", "ACCEPTED"];

const ownerCondition = (owner: ListingOwner) =>
  "freelancerId" in owner
    ? eq(service_bookings.freelancer_id, owner.freelancerId)
    : eq(service_bookings.agency_id, owner.agencyId);

const fromRow = (row: BookingRow) => ({
  id: row.id,
  listingId: row.listing_id,
  title: row.title,
  price: Number(row.price),
  milestones: row.milestones,
  note: row.note,
  preferredStart: row.preferred_start,
  status: row.status as BookingStatus,
  declineReason: row.decline_reason,
  conversationId: row.conversation_id,
  respondedAt: row.responded_at,
  createdAt: row.created_at,
});

const clerkNames = async (ids: string[]) => {
  const names = new Map<string, { name: string; imageUrl: string | null }>();
  if (!ids.length || !env.clerkSecretKey) return names;
  try {
    const { data } = await createClerkClient({ secretKey: env.clerkSecretKey }).users.getUserList({
      userId: ids,
      limit: ids.length,
    });
    for (const user of data) {
      names.set(user.id, { name: user.fullName || "Client", imageUrl: user.imageUrl || null });
    }
  } catch {
    // Fall back to generic names.
  }
  return names;
};

/** Notification target for the pro side of a booking. Links are relative to that dashboard. */
const proRecipient = (row: Pick<BookingRow, "freelancer_id" | "agency_id">) =>
  row.agency_id ? { agencyId: row.agency_id } : { recipientId: row.freelancer_id! };

export const requestBooking = async (
  clientId: string,
  input: { listingId: string; note: string | null; preferredStart: string | null },
) => {
  const [listing]: ListingRow[] = await db
    .select()
    .from(service_listings)
    .where(eq(service_listings.id, input.listingId))
    .limit(1);
  if (!listing || listing.status !== "ACTIVE") {
    throw new ApiError(404, "This service is no longer available.");
  }

  const [open] = await db
    .select({ id: service_bookings.id })
    .from(service_bookings)
    .where(
      and(
        eq(service_bookings.client_id, clientId),
        eq(service_bookings.listing_id, listing.id),
        inArray(service_bookings.status, OPEN_STATUSES),
      ),
    )
    .limit(1);
  if (open) {
    throw new ApiError(409, "You already have an open request for this service.");
  }

  const [booking] = await db
    .insert(service_bookings)
    .values({
      listing_id: listing.id,
      client_id: clientId,
      freelancer_id: listing.freelancer_id,
      agency_id: listing.agency_id,
      title: listing.title,
      price: listing.price,
      milestones: listing.milestones,
      note: input.note,
      preferred_start: input.preferredStart,
    })
    .returning();
  const created = booking as BookingRow;

  const clientName = (await clerkNames([clientId])).get(clientId)?.name ?? "A client";
  await sendNotification({
    ...proRecipient(created),
    type: "BOOKING_REQUESTED",
    title: "New booking request",
    message: `${clientName} wants to book “${created.title}”.`,
    link: "/bookings",
    metadata: { bookingId: created.id },
  });

  return fromRow(created);
};

/** Contract IDs for paid bookings, keyed by booking ID. */
const contractsFor = async (rows: BookingRow[]) => {
  const paid = rows.filter((row) => row.status === "PAID").map((row) => row.id);
  if (!paid.length) return new Map<string, string>();
  const links = (await db
    .select({ bookingId: contracts.booking_id, contractId: contracts.id })
    .from(contracts)
    .where(inArray(contracts.booking_id, paid))) as { bookingId: string; contractId: string }[];
  return new Map(links.map((link) => [link.bookingId, link.contractId]));
};

export const getClientBookings = async (clientId: string) => {
  const rows: BookingRow[] = await db
    .select()
    .from(service_bookings)
    .where(eq(service_bookings.client_id, clientId))
    .orderBy(desc(service_bookings.created_at));
  const [owners, contractIds] = await Promise.all([getListingOwners(rows), contractsFor(rows)]);
  return rows.map((row) => ({
    ...fromRow(row),
    contractId: contractIds.get(row.id) ?? null,
    pro: owners.get(row.id) ?? null,
  }));
};

export const getReceivedBookings = async (owner: ListingOwner) => {
  const rows: BookingRow[] = await db
    .select()
    .from(service_bookings)
    .where(ownerCondition(owner))
    .orderBy(desc(service_bookings.created_at));
  const [names, contractIds] = await Promise.all([
    clerkNames([...new Set(rows.map((row) => row.client_id))]),
    contractsFor(rows),
  ]);
  return rows.map((row) => ({
    ...fromRow(row),
    contractId: contractIds.get(row.id) ?? null,
    client: {
      name: names.get(row.client_id)?.name ?? "Client",
      avatarUrl: names.get(row.client_id)?.imageUrl ?? null,
    },
  }));
};

const findOwnedBooking = async (owner: ListingOwner, id: string) => {
  const [row]: BookingRow[] = await db
    .select()
    .from(service_bookings)
    .where(and(eq(service_bookings.id, id), ownerCondition(owner)))
    .limit(1);
  if (!row) throw new ApiError(404, "Booking not found.");
  return row;
};

/** Opens (or reuses) the chat between the client and the pro/agency for this booking. */
const openBookingConversation = async (booking: BookingRow) =>
  db.transaction(async (transaction) => {
    const contextKey = `booking:${booking.id}`;
    const [created] = (await transaction
      .insert(conversations)
      .values({ context_key: contextKey })
      .onConflictDoNothing({ target: conversations.context_key })
      .returning({ id: conversations.id })) as { id: string }[];
    const conversation =
      created ??
      (
        await transaction
          .select({ id: conversations.id })
          .from(conversations)
          .where(eq(conversations.context_key, contextKey))
          .limit(1)
      )[0];
    if (!conversation) throw new ApiError(500, "Chat could not be created.");

    await transaction
      .insert(conversation_participants)
      .values([
        {
          conversation_id: conversation.id,
          account_id: booking.client_id,
          participant_type: "CLIENT",
        },
        booking.agency_id
          ? {
              conversation_id: conversation.id,
              agency_id: booking.agency_id,
              participant_type: "AGENCY",
            }
          : {
              conversation_id: conversation.id,
              account_id: booking.freelancer_id!,
              participant_type: "FREELANCER",
            },
      ])
      .onConflictDoNothing();
    return conversation.id;
  });

/**
 * Pro agrees to consider the request: a chat opens with the client's request as the
 * first message, followed by the pro's acceptance.
 */
export const acceptBooking = async (owner: ListingOwner, actorId: string, id: string) => {
  const booking = await findOwnedBooking(owner, id);
  // The client pays right after acceptance, so the seller must be able to receive funds.
  if (!(await hasPayoutDetails(owner))) {
    throw new ApiError(
      409,
      "Add your payout details before accepting bookings, so you can be paid from escrow.",
    );
  }
  if (booking.status !== "REQUESTED") {
    throw new ApiError(409, "This request has already been answered.");
  }

  const conversationId = await openBookingConversation(booking);
  const [updated] = await db
    .update(service_bookings)
    .set({
      status: "ACCEPTED",
      conversation_id: conversationId,
      responded_at: new Date(),
      updated_at: new Date(),
    })
    .where(and(eq(service_bookings.id, id), eq(service_bookings.status, "REQUESTED")))
    .returning();
  if (!updated) throw new ApiError(409, "This request has already been answered.");

  const requestLines = [`Booking request: “${booking.title}” (R${Number(booking.price).toLocaleString("en-ZA")})`];
  if (booking.preferred_start) requestLines.push(`Preferred start: ${booking.preferred_start}`);
  if (booking.note) requestLines.push("", booking.note);
  await sendMessage(conversationId, booking.client_id, {
    body: requestLines.join("\n"),
    attachments: [],
  });
  await sendMessage(conversationId, actorId, {
    body: `I've accepted your request for “${booking.title}”. Let's chat here about the details before you pay into escrow.`,
    attachments: [],
  });

  await sendNotification({
    recipientId: booking.client_id,
    type: "BOOKING_ACCEPTED",
    title: "Booking request accepted",
    message: `Your request for “${booking.title}” was accepted. You can now chat with the pro.`,
    link: `/messages?conversationId=${conversationId}`,
    metadata: { bookingId: booking.id, conversationId },
  });

  return fromRow(updated as BookingRow);
};

export const declineBooking = async (owner: ListingOwner, id: string, reason: string | null) => {
  const booking = await findOwnedBooking(owner, id);
  if (booking.status !== "REQUESTED") {
    throw new ApiError(409, "This request has already been answered.");
  }
  const [updated] = await db
    .update(service_bookings)
    .set({
      status: "DECLINED",
      decline_reason: reason,
      responded_at: new Date(),
      updated_at: new Date(),
    })
    .where(and(eq(service_bookings.id, id), eq(service_bookings.status, "REQUESTED")))
    .returning();
  if (!updated) throw new ApiError(409, "This request has already been answered.");

  await sendNotification({
    recipientId: booking.client_id,
    type: "BOOKING_DECLINED",
    title: "Booking request declined",
    message: `Your request for “${booking.title}” was declined.`,
    link: "/bookings",
    metadata: { bookingId: booking.id },
  });
  return fromRow(updated as BookingRow);
};

export const cancelBooking = async (clientId: string, id: string) => {
  // Once money is moving through TradeSafe, the booking can't simply be cancelled.
  const [payment] = (await db
    .select({ state: tradesafe_transactions.state })
    .from(tradesafe_transactions)
    .where(
      and(
        eq(tradesafe_transactions.booking_id, id),
        eq(tradesafe_transactions.client_id, clientId),
        ne(tradesafe_transactions.state, "CREATED"),
      ),
    )
    .limit(1)) as { state: string }[];
  if (payment) {
    throw new ApiError(409, "Your payment is already being processed, so this booking can't be cancelled.");
  }

  const [updated]: BookingRow[] = await db
    .update(service_bookings)
    .set({ status: "CANCELLED", updated_at: new Date() })
    .where(
      and(
        eq(service_bookings.id, id),
        eq(service_bookings.client_id, clientId),
        inArray(service_bookings.status, OPEN_STATUSES),
      ),
    )
    .returning();
  if (!updated) throw new ApiError(404, "Open booking request not found.");

  await sendNotification({
    ...proRecipient(updated),
    type: "BOOKING_CANCELLED",
    title: "Booking request cancelled",
    message: `The client cancelled their request for “${updated.title}”.`,
    link: "/bookings",
    metadata: { bookingId: updated.id },
  });
  return fromRow(updated);
};

// TradeSafe's minimum; delivery is only completed once the client approves.
const BOOKING_INSPECTION_DAYS = 1;

/**
 * Starts payment for an accepted booking: escrows the whole service in one TradeSafe
 * transaction (one allocation per milestone) and returns the checkout link. TradeSafe's
 * FUNDS_RECEIVED callback then creates the contract (see createContractFromBooking).
 */
export const createBookingCheckout = async (clientId: string, bookingId: string) => {
  if (env.paymentProvider !== "tradesafe") {
    throw new ApiError(503, "Booking payments need TradeSafe (PAYMENT_PROVIDER=tradesafe).");
  }

  const [booking]: BookingRow[] = await db
    .select()
    .from(service_bookings)
    .where(and(eq(service_bookings.id, bookingId), eq(service_bookings.client_id, clientId)))
    .limit(1);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (booking.status === "PAID") throw new ApiError(409, "This booking is already paid.");
  if (booking.status !== "ACCEPTED") {
    throw new ApiError(409, "You can pay once the pro has accepted your request.");
  }

  // Reuse an unpaid escrow from an earlier attempt instead of creating a duplicate.
  const [existing] = (await db
    .select({
      transactionId: tradesafe_transactions.transaction_id,
      state: tradesafe_transactions.state,
    })
    .from(tradesafe_transactions)
    .where(eq(tradesafe_transactions.booking_id, booking.id))
    .orderBy(desc(tradesafe_transactions.created_at))
    .limit(1)) as { transactionId: string; state: string }[];
  if (existing) {
    if (existing.state === "CREATED") return getCheckoutLink(existing.transactionId);
    throw new ApiError(409, "Payment for this booking is already being processed.");
  }

  // Seller = the pro or agency (paid out to their bank); CoverPro is the AGENT and
  // takes its commission from the seller's side.
  const [buyerToken, sellerToken, agentToken] = await Promise.all([
    getClientTradeSafeToken(clientId),
    getSellerToken(
      booking.agency_id
        ? { agencyId: booking.agency_id }
        : { freelancerId: booking.freelancer_id! },
    ),
    getPlatformToken(),
  ]);

  const amounts = booking.milestones.map((milestone: ListingMilestone) => Number(milestone.amount));
  let elapsedDays = 0;
  const transaction = await createEscrowTransaction({
    title: booking.title,
    description: `CoverPro booking: ${booking.title}`,
    reference: `CPB-${booking.id}`,
    buyerToken,
    sellerToken,
    agent: { token: agentToken, feePercent: PLATFORM_FEE_RATE * 100 },
    allocations: booking.milestones.map((milestone: ListingMilestone, position: number) => {
      elapsedDays += milestone.days;
      return {
        title: milestone.title,
        description: milestone.description || milestone.title,
        value: amounts[position]!,
        daysToDeliver: elapsedDays,
        daysToInspect: BOOKING_INSPECTION_DAYS,
      };
    }),
  });

  await db.insert(tradesafe_transactions).values({
    transaction_id: transaction.id,
    booking_id: booking.id,
    client_id: clientId,
    amount: amounts.reduce((total: number, amount: number) => total + amount, 0).toFixed(2),
    allocation_ids: transaction.allocationIds,
    state: transaction.state,
  });

  return getCheckoutLink(transaction.id);
};
