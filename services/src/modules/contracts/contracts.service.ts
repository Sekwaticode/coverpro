import type Stripe from "stripe";
import { createClerkClient } from "@clerk/backend";
import { and, asc, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { env } from "../../config/env.js";
import { AUTO_APPROVE_AFTER_DAYS, PLATFORM_FEE_RATE } from "../../config/constants.js";
import { stripe } from "../../config/stripe.js";
import { db } from "../../database/client.js";
import {
  accounts,
  agency_earning,
  agency_metadata,
  client_metadata,
  client_spents,
  contract_milestones,
  contracts,
  earning_history,
  freelancer_earning,
  conversation_participants,
  conversations,
  job_posts,
  messages,
  proposals,
  reviews,
  service_bookings,
  tradesafe_transactions,
} from "../../database/schema.js";
import {
  advanceAllocation,
  createEscrowTransaction,
  createTradeSafeUserToken,
  getCheckoutLink,
  getPlatformToken,
  type AllocationTarget,
} from "../tradesafe/tradesafe.api.js";
import { logger } from "../../config/logger.js";
import { getSellerToken } from "../tradesafe/tradesafe.payouts.js";
import { ApiError } from "../../utils/api-error.js";
import type { ListingMilestone } from "../../database/schema.js";
import { sendNotification } from "../../events/publisher.js";
import { emitConversationUpdate } from "../messaging/messaging.socket.js";
import { getJSSContribution } from "../freelancer/freelancer.service.js";
import { getAgencyOwnerId } from "../agency/agency.service.js";


const participantMatch = (accountId: string, agencyId?: string | null) =>
  agencyId
    ? eq(conversation_participants.agency_id, agencyId)
    : eq(conversation_participants.account_id, accountId);

const DAY_MS = 24 * 60 * 60 * 1000;
// TradeSafe's minimum. CoverPro only marks delivery complete once the client approves,
// so this is just the delay before TradeSafe auto-releases (the client can release
// instantly via TradeSafe's own email/SMS link).
const TRADESAFE_INSPECTION_DAYS = 1;

/** The TradeSafe transaction + allocation behind a milestone (null for Stripe contracts). */
const getMilestoneAllocation = async (milestoneId: string) => {
  const [row] = (await db
    .select({
      transactionId: contracts.tradesafe_transaction_id,
      allocationId: contract_milestones.tradesafe_allocation_id,
    })
    .from(contract_milestones)
    .innerJoin(contracts, eq(contracts.id, contract_milestones.contract_id))
    .where(eq(contract_milestones.id, milestoneId))
    .limit(1)) as { transactionId: string | null; allocationId: string | null }[];
  return row?.transactionId && row.allocationId
    ? { transactionId: row.transactionId, allocationId: row.allocationId }
    : null;
};

/**
 * Moves a milestone's TradeSafe allocation to `target`. Returns false for non-TradeSafe
 * milestones. Errors propagate so callers can decide whether they are fatal.
 */
const syncMilestoneAllocation = async (milestoneId: string, target: AllocationTarget) => {
  const allocation = await getMilestoneAllocation(milestoneId);
  if (!allocation) return false;
  await advanceAllocation(allocation.transactionId, allocation.allocationId, target);
  return true;
};

/** Marks a milestone as started on TradeSafe. Best effort: submitting retries it anyway. */
const startMilestoneAllocation = async (milestoneId: string) => {
  try {
    await syncMilestoneAllocation(milestoneId, "STARTED");
  } catch (error) {
    await logger.warn({
      message: "TradeSafe start delivery failed",
      eventName: "tradesafe.allocation.start_failed",
      attributes: {
        "coverpro.milestone_id": milestoneId,
        "error.message": error instanceof Error ? error.message : String(error),
      },
    });
  }
};

/** TradeSafe buyer token for a client, created on first use. */
export const getClientTradeSafeToken = async (clientId: string) => {
  const [account] = await db
    .select({
      email: accounts.email,
      tokenId: accounts.tradesafe_token_id,
    })
    .from(accounts)
    .where(eq(accounts.auth_id, clientId))
    .limit(1);
  if (!account) throw new ApiError(404, "Client account not found.");
  if (account.tokenId) return account.tokenId;

  const clerk = createClerkClient({ secretKey: env.clerkSecretKey });
  const user = await clerk.users.getUser(clientId).catch(() => null);
  const tokenId = await createTradeSafeUserToken({
    givenName: user?.firstName?.trim() || "CoverPro",
    familyName: user?.lastName?.trim() || "Client",
    email: account.email,
  });

  await db
    .update(accounts)
    .set({ tradesafe_token_id: tokenId, updated_at: new Date() })
    .where(eq(accounts.auth_id, clientId));
  return tokenId;
};

/**
 * Escrows the whole contract in one TradeSafe transaction (one allocation per milestone)
 * and returns the checkout link. The FUNDS_RECEIVED callback then creates the contract.
 */
const createTradeSafeContractCheckout = async (
  clientId: string,
  proposalId: string,
  job: { title: string; milestones: { title: string; budget: number; dueDate: string }[] },
  seller: { freelancerId: string } | { agencyId: string },
) => {
  const amounts = job.milestones.map((milestone) => Number(milestone.budget));
  if (amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
    throw new ApiError(400, "Contract milestones are invalid.");
  }

  // Seller = the pro/agency who sent the proposal; CoverPro is the AGENT (commission).
  const [buyerToken, sellerToken, agentToken] = await Promise.all([
    getClientTradeSafeToken(clientId),
    getSellerToken(seller),
    getPlatformToken(),
  ]);

  const now = Date.now();
  const transaction = await createEscrowTransaction({
    title: job.title,
    description: `CoverPro contract: ${job.title}`,
    reference: `CP-${proposalId}`,
    buyerToken,
    sellerToken,
    agent: { token: agentToken, feePercent: PLATFORM_FEE_RATE * 100 },
    allocations: job.milestones.map((milestone, position) => ({
      title: milestone.title,
      description: milestone.title,
      value: amounts[position]!,
      daysToDeliver: Math.ceil((Date.parse(milestone.dueDate) - now) / DAY_MS),
      daysToInspect: TRADESAFE_INSPECTION_DAYS,
    })),
  });

  await db.insert(tradesafe_transactions).values({
    transaction_id: transaction.id,
    proposal_id: proposalId,
    client_id: clientId,
    amount: amounts.reduce((total, amount) => total + amount, 0).toFixed(2),
    allocation_ids: transaction.allocationIds,
    state: transaction.state,
  });

  return getCheckoutLink(transaction.id);
};

export const createContractCheckout = async (
  clientId: string,
  proposalId: string,
) => {
  const usesTradeSafe = env.paymentProvider === "tradesafe";
  if (!usesTradeSafe && (!env.stripeSecretKey || !env.clientDashboard)) {
    throw new ApiError(503, "Contract payments are not configured.");
  }

  const [offer] = await db
    .select({
      proposal: proposals,
      job: job_posts,
      account: accounts,
    })
    .from(proposals)
    .innerJoin(job_posts, eq(proposals.job_id, job_posts.id))
    .innerJoin(accounts, eq(accounts.auth_id, job_posts.client_id))
    .where(and(eq(proposals.id, proposalId), eq(job_posts.client_id, clientId)))
    .limit(1);

  if (!offer) throw new ApiError(404, "Proposal not found.");
  if (offer.proposal.status !== "INTERVIEWED") {
    throw new ApiError(
      400,
      "Interview the freelancer before sending an offer.",
    );
  }

  const firstMilestone = offer.job.milestones[0];
  if (!firstMilestone) {
    throw new ApiError(400, "This job does not have a milestone to fund.");
  }

  const amount = Number(firstMilestone.budget);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, "The first milestone amount is invalid.");
  }

  if (usesTradeSafe) {
    return createTradeSafeContractCheckout(
      clientId,
      offer.proposal.id,
      offer.job,
      offer.proposal.sender_type === "AGENCY"
        ? { agencyId: offer.proposal.sender_id }
        : { freelancerId: offer.proposal.sender_id },
    );
  }

  let customerId = offer.account.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: offer.account.email,
      metadata: { accountId: clientId, role: "CLIENT" },
    });
    customerId = customer.id;
    await db
      .update(accounts)
      .set({ stripe_customer_id: customerId, updated_at: new Date() })
      .where(eq(accounts.auth_id, clientId));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    invoice_creation: { enabled: true },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: { name: firstMilestone.title },
        },
      },
    ],
    metadata: {
      paymentType: "CONTRACT_MILESTONE",
      proposalId: offer.proposal.id,
      jobId: offer.job.id,
      clientId,
    },
    success_url: `${env.clientDashboard}/proposals/${offer.job.id}?payment=success`,
    cancel_url: `${env.clientDashboard}/proposals/${offer.job.id}?payment=cancelled`,
  });

  if (!session.url) throw new ApiError(502, "Stripe Checkout could not start.");
  return session.url;
};

export const createMilestoneFundingCheckout = async (
  clientId: string,
  contractId: string,
  milestoneId: string,
  requirements?: string,
) => {
  if (!env.clientDashboard) {
    throw new ApiError(503, "Contract payments are not configured.");
  }

  const [milestone] = await db
    .select({
      contractId: contracts.id,
      contractTitle: contracts.title,
      contractStatus: contracts.status,
      tradesafeTransactionId: contracts.tradesafe_transaction_id,
      tradesafeAllocationId: contract_milestones.tradesafe_allocation_id,
      milestoneId: contract_milestones.id,
      milestoneTitle: contract_milestones.title,
      milestoneAmount: contract_milestones.amount,
      milestonePosition: contract_milestones.position,
      milestoneStatus: contract_milestones.status,
      fundedAt: contract_milestones.funded_at,
      customerId: accounts.stripe_customer_id,
      incompletePrevious: sql<number>`(
        select count(*)::int from contract_milestones previous
        where previous.contract_id = ${contracts.id}
          and previous.position < ${contract_milestones.position}
          and previous.status <> 'COMPLETED'
      )`,
      activeMilestones: sql<number>`(
        select count(*)::int from contract_milestones active
        where active.contract_id = ${contracts.id}
          and active.status = 'ACTIVE'
      )`,
    })
    .from(contracts)
    .innerJoin(
      contract_milestones,
      eq(contract_milestones.contract_id, contracts.id),
    )
    .innerJoin(accounts, eq(accounts.auth_id, contracts.client_id))
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.client_id, clientId),
        eq(contract_milestones.id, milestoneId),
      ),
    )
    .limit(1);

  if (!milestone) throw new ApiError(404, "Contract milestone not found.");
  if (
    milestone.contractStatus !== "ACTIVE" ||
    milestone.milestoneStatus !== "PENDING" ||
    milestone.fundedAt ||
    milestone.incompletePrevious > 0 ||
    milestone.activeMilestones > 0
  ) {
    throw new ApiError(409, "This milestone cannot be funded yet.");
  }

  // TradeSafe contracts escrow every milestone upfront, so activating one needs no payment.
  if (milestone.tradesafeTransactionId) {
    if (!milestone.tradesafeAllocationId) {
      throw new ApiError(
        409,
        "This milestone was added after the contract was escrowed and can't be funded yet.",
      );
    }
    await activateFundedMilestone(
      {
        contractId: milestone.contractId,
        milestoneId: milestone.milestoneId,
        clientId,
        requirements: requirements ?? null,
      },
      { funded_at: new Date() },
    );
    return `${env.clientDashboard}/contracts?contractId=${milestone.contractId}&funding=success`;
  }

  if (!env.stripeSecretKey) {
    throw new ApiError(503, "Contract payments are not configured.");
  }
  if (!milestone.customerId) {
    throw new ApiError(409, "Client payment profile was not found.");
  }

  const amount = Number(milestone.milestoneAmount);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: milestone.customerId,
    invoice_creation: { enabled: true },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(amount * 100),
          product_data: { name: milestone.milestoneTitle },
        },
      },
    ],
    metadata: {
      paymentType: "CONTRACT_MILESTONE_FUNDING",
      contractId: milestone.contractId,
      milestoneId: milestone.milestoneId,
      clientId,
      requirements: requirements ?? "",
    },
    success_url: `${env.clientDashboard}/contracts?contractId=${milestone.contractId}&funding=success`,
    cancel_url: `${env.clientDashboard}/contracts?contractId=${milestone.contractId}&funding=cancelled`,
  });

  if (!session.url) throw new ApiError(502, "Stripe Checkout could not start.");
  return session.url;
};

export const fundContractMilestoneFromPayment = async (
  session: Stripe.Checkout.Session,
) => {
  if (
    session.payment_status !== "paid" ||
    session.metadata?.paymentType !== "CONTRACT_MILESTONE_FUNDING"
  ) {
    return;
  }
  const { contractId, milestoneId, clientId } = session.metadata;
  if (!contractId || !milestoneId || !clientId) {
    throw new ApiError(400, "Stripe milestone metadata is missing.");
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await activateFundedMilestone(
    {
      contractId,
      milestoneId,
      clientId,
      requirements: session.metadata?.requirements || null,
    },
    {
      funded_at: new Date(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    },
    (milestone) => {
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      if (
        customerId !== milestone.customerId ||
        session.amount_total !==
          Math.round(Number(milestone.milestoneAmount) * 100) ||
        session.currency !== "usd"
      ) {
        throw new ApiError(400, "Stripe milestone payment does not match.");
      }
    },
  );
};

/** Moves a PENDING milestone to ACTIVE and tells the pro they can start work. */
const activateFundedMilestone = async (
  {
    contractId,
    milestoneId,
    clientId,
    requirements,
  }: {
    contractId: string;
    milestoneId: string;
    clientId: string;
    requirements: string | null;
  },
  fields: {
    funded_at: Date;
    stripe_checkout_session_id?: string;
    stripe_payment_intent_id?: string;
  },
  verify?: (milestone: {
    customerId: string | null;
    milestoneAmount: string;
  }) => void,
) => {
  const [milestone] = await db
    .select({
      contractId: contracts.id,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      milestoneId: contract_milestones.id,
      milestoneTitle: contract_milestones.title,
      milestoneAmount: contract_milestones.amount,
      conversationId: conversations.id,
      customerId: accounts.stripe_customer_id,
    })
    .from(contracts)
    .innerJoin(
      contract_milestones,
      eq(contract_milestones.contract_id, contracts.id),
    )
    .innerJoin(
      conversations,
      eq(conversations.id, contracts.conversation_id),
    )
    .innerJoin(accounts, eq(accounts.auth_id, contracts.client_id))
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.client_id, clientId),
        eq(contracts.status, "ACTIVE"),
        eq(contract_milestones.id, milestoneId),
        eq(contract_milestones.status, "PENDING"),
      ),
    )
    .limit(1);
  if (!milestone) return;

  const recipientId =
    milestone.freelancerId ??
    (milestone.agencyId ? await getAgencyOwnerId(milestone.agencyId) : null);
  if (!recipientId) throw new ApiError(500, "Contract owner could not be resolved.");

  verify?.(milestone);

  const now = new Date();
  const funded = await db.transaction(async (transaction) => {
    const [updated] = await transaction
      .update(contract_milestones)
      .set({
        status: "ACTIVE",
        ...fields,
        updated_at: now,
      })
      .where(
        and(
          eq(contract_milestones.id, milestone.milestoneId),
          eq(contract_milestones.status, "PENDING"),
        ),
      )
      .returning({ id: contract_milestones.id });
    if (!updated) return false;

    const [message] = await transaction
      .insert(messages)
      .values({
        conversation_id: milestone.conversationId,
        sender_id: clientId,
        message_type: "SYSTEM_EVENT",
        body: `Milestone funded: “${milestone.milestoneTitle}”.`,
        event_type: "MILESTONE_FUNDED",
        event_payload: {
          contractId: milestone.contractId,
          milestoneId: milestone.milestoneId,
          milestoneTitle: milestone.milestoneTitle,
          amount: Number(milestone.milestoneAmount),
          requirements,
        },
      })
      .returning({ id: messages.id, createdAt: messages.created_at });
    if (!message) throw new ApiError(500, "Milestone funding message failed.");
    await transaction
      .update(conversations)
      .set({
        last_message_id: message.id,
        last_message_at: message.createdAt,
        updated_at: now,
      })
      .where(eq(conversations.id, milestone.conversationId));
    await transaction
      .update(conversation_participants)
      .set({ unread_count: sql`${conversation_participants.unread_count} + 1` })
      .where(
        and(
          eq(
            conversation_participants.conversation_id,
            milestone.conversationId,
          ),
          participantMatch(recipientId, milestone.agencyId),
        ),
      );
    return true;
  });

  if (!funded) return;
  await startMilestoneAllocation(milestone.milestoneId);
  await sendNotification(
    milestone.agencyId
      ? {
          agencyId: milestone.agencyId,
          type: "MILESTONE_FUNDED",
          title: "Milestone funded",
          message: `The client funded “${milestone.milestoneTitle}”. You can start work now.`,
          link: `/contracts?contractId=${milestone.contractId}`,
          metadata: {
            contractId: milestone.contractId,
            milestoneId: milestone.milestoneId,
          },
        }
      : {
          recipientId,
          type: "MILESTONE_FUNDED",
          title: "Milestone funded",
          message: `The client funded “${milestone.milestoneTitle}”. You can start work now.`,
          link: `/contracts?contractId=${milestone.contractId}`,
          metadata: {
            contractId: milestone.contractId,
            milestoneId: milestone.milestoneId,
          },
        },
  );
  await emitConversationUpdate(milestone.conversationId);
};

export const getAccountContracts = async (
  userId: string,
  role: "client" | "freelancer" | "agency",
  agencyId?: string | null,
) => {
  const rows = await db
    .select({
      id: contracts.id,
      proposalId: contracts.proposal_id,
      jobId: contracts.job_id,
      clientId: contracts.client_id,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      title: contracts.title,
      description: sql<string>`coalesce(${job_posts.description}, '')`,
      totalAmount: contracts.total_amount,
      status: contracts.status,
      startedAt: contracts.started_at,
      completedAt: contracts.completed_at,
      createdAt: contracts.created_at,
      conversationId: conversations.id,
      clientCompanyName: client_metadata.company_name,
      milestoneId: contract_milestones.id,
      milestoneTitle: contract_milestones.title,
      milestoneAmount: contract_milestones.amount,
      milestoneDueDate: contract_milestones.due_date,
      milestonePosition: contract_milestones.position,
      milestoneStatus: contract_milestones.status,
      milestoneFundedAt: contract_milestones.funded_at,
      milestonePaymentRequestedAt: contract_milestones.payment_requested_at,
      milestoneSubmissionMessage: contract_milestones.submission_message,
      milestoneSubmissionDeliveryLink:
        contract_milestones.submission_delivery_link,
      milestoneCompletedAt: contract_milestones.completed_at,
      reviewedByCurrentUser:
        role === "agency" && agencyId
          ? sql<boolean>`exists(
              select 1 from reviews account_review
              where account_review.contract_id = ${contracts.id}
                and account_review.agency_id = ${agencyId}
                and account_review.reviewee_id = ${contracts.client_id}
            )`
          : sql<boolean>`exists(
              select 1 from reviews account_review
              where account_review.contract_id = ${contracts.id}
                and account_review.reviewer_id = ${userId}
            )`,
    })
    .from(contracts)
    .leftJoin(job_posts, eq(contracts.job_id, job_posts.id))
    .innerJoin(
      contract_milestones,
      eq(contract_milestones.contract_id, contracts.id),
    )
    .leftJoin(
      conversations,
      eq(conversations.id, contracts.conversation_id),
    )
    .leftJoin(client_metadata, eq(client_metadata.auth_id, contracts.client_id))
    .where(
      role === "client"
        ? eq(contracts.client_id, userId)
        : role === "agency"
          ? eq(contracts.agency_id, agencyId!)
          : eq(contracts.freelancer_id, userId),
    )
    .orderBy(desc(contracts.created_at), asc(contract_milestones.position));

  const counterpartyIds = [
    ...new Set(
      rows
        .map((row) => (role === "client" ? row.freelancerId : row.clientId))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const names = new Map<string, string>();
  const avatars = new Map<string, string | null>();
  if (env.clerkSecretKey && counterpartyIds.length) {
    const clerk = createClerkClient({ secretKey: env.clerkSecretKey });
    await Promise.all(
      counterpartyIds.map(async (accountId) => {
        try {
          const user = await clerk.users.getUser(accountId);
          names.set(
            accountId,
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
              "Marketplace user",
          );
          avatars.set(accountId, user.imageUrl || null);
        } catch {
          names.set(accountId, "Marketplace user");
          avatars.set(accountId, null);
        }
      }),
    );
  }

  const agencyIds = [
    ...new Set(
      role === "client"
        ? rows.map((row) => row.agencyId).filter((id): id is string => Boolean(id))
        : [],
    ),
  ];
  const agencyNames = new Map<string, string>();
  const agencyAvatars = new Map<string, string | null>();
  if (agencyIds.length) {
    const agencyRows = await db
      .select({
        id: agency_metadata.id,
        name: agency_metadata.name,
        avatar: agency_metadata.avatar_image,
      })
      .from(agency_metadata)
      .where(inArray(agency_metadata.id, agencyIds));
    agencyRows.forEach((row) => {
      agencyNames.set(row.id, row.name ?? "Agency");
      agencyAvatars.set(row.id, row.avatar?.url ?? null);
    });
  }

  const result = new Map<string, any>();
  for (const row of rows) {
    const counterpartyId =
      role === "client" ? row.freelancerId ?? row.agencyId : row.clientId;
    const isAgencyCounterparty =
      role === "client" && !row.freelancerId && Boolean(row.agencyId);
    const contract = result.get(row.id) ?? {
      id: row.id,
      proposalId: row.proposalId,
      jobId: row.jobId,
      title: row.title,
      description: row.description,
      totalAmount: Number(row.totalAmount),
      status: row.status,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      conversationId: row.conversationId,
      counterpartyId,
      counterpartyName: isAgencyCounterparty
        ? agencyNames.get(row.agencyId!) ?? "Agency"
        : (role === "freelancer" || role === "agency"
            ? row.clientCompanyName
            : null) ??
          names.get(counterpartyId ?? "") ??
          "Marketplace user",
      counterpartyAvatar: isAgencyCounterparty
        ? agencyAvatars.get(row.agencyId!) ?? null
        : avatars.get(counterpartyId ?? "") ?? null,
      reviewedByCurrentUser: row.reviewedByCurrentUser,
      milestones: [],
    };
    contract.milestones.push({
      id: row.milestoneId,
      title: row.milestoneTitle,
      amount: Number(row.milestoneAmount),
      dueDate: row.milestoneDueDate,
      position: row.milestonePosition,
      status: row.milestoneStatus,
      fundedAt: row.milestoneFundedAt,
      paymentRequestedAt: row.milestonePaymentRequestedAt,
      submissionMessage: row.milestoneSubmissionMessage,
      submissionDeliveryLink: row.milestoneSubmissionDeliveryLink,
      completedAt: row.milestoneCompletedAt,
    });
    result.set(row.id, contract);
  }

  return [...result.values()];
};

export const finishContractWithReview = async (
  contractId: string,
  reviewerId: string,
  role: "client" | "freelancer",
  rating: number,
  comment: string,
  agencyId?: string | null,
) => {
  const [contract] = await db
    .select({
      id: contracts.id,
      title: contracts.title,
      status: contracts.status,
      clientId: contracts.client_id,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      conversationId: conversations.id,
      incompleteMilestones: sql<number>`(
        select count(*)::int from contract_milestones incomplete
        where incomplete.contract_id = ${contracts.id}
          and incomplete.status <> 'COMPLETED'
      )`,
      // Same "agency as one entity" check as reviewedByCurrentUser above:
      // once any teammate reviews on the agency's behalf, no other teammate
      // should be able to submit a second review for the same contract.
      existingReview:
        role !== "client" && agencyId
          ? sql<number>`(
              select count(*)::int from reviews existing_review
              where existing_review.contract_id = ${contracts.id}
                and existing_review.agency_id = ${agencyId}
                and existing_review.reviewee_id = ${contracts.client_id}
            )`
          : sql<number>`(
              select count(*)::int from reviews existing_review
              where existing_review.contract_id = ${contracts.id}
                and existing_review.reviewer_id = ${reviewerId}
            )`,
    })
    .from(contracts)
    .leftJoin(
      conversations,
      eq(conversations.id, contracts.conversation_id),
    )
    .where(
      and(
        eq(contracts.id, contractId),
        role === "client"
          ? eq(contracts.client_id, reviewerId)
          : agencyId
            ? eq(contracts.agency_id, agencyId)
            : eq(contracts.freelancer_id, reviewerId),
      ),
    )
    .limit(1);

  if (!contract) throw new ApiError(404, "Contract not found.");
  if (contract.status === "PENDING") {
    throw new ApiError(409, "This contract has not started yet.");
  }
  if (contract.incompleteMilestones > 0) {
    throw new ApiError(
      409,
      "Complete every milestone before finishing the contract.",
    );
  }
  if (contract.existingReview > 0) {
    throw new ApiError(409, "You have already reviewed this contract.");
  }

  const freelancerAccountId =
    contract.freelancerId ??
    (contract.agencyId ? await getAgencyOwnerId(contract.agencyId) : null);
  if (!freelancerAccountId) {
    throw new ApiError(500, "Contract owner could not be resolved.");
  }

  const revieweeId =
    role === "client" ? freelancerAccountId : contract.clientId;
  const now = new Date();
  const newlyCompleted = contract.status === "ACTIVE";

  await db.transaction(async (transaction) => {
    await transaction.insert(reviews).values({
      contract_id: contract.id,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      agency_id: contract.agencyId ?? null,
      rating,
      comment,
    });

    if (role === "client") {
      const jssContribution = getJSSContribution(rating);
      if (contract.agencyId) {
        await transaction
          .insert(agency_earning)
          .values({
            agency_id: contract.agencyId,
            review_count: 1,
            rating: rating.toFixed(2),
            job_success_score: jssContribution.toFixed(2),
          })
          .onConflictDoUpdate({
            target: agency_earning.agency_id,
            set: {
              rating: sql`((${agency_earning.rating} * ${agency_earning.review_count}) + ${rating}) / (${agency_earning.review_count} + 1)`,
              job_success_score: sql`((${agency_earning.job_success_score} * ${agency_earning.review_count}) + ${jssContribution}) / (${agency_earning.review_count} + 1)`,
              review_count: sql`${agency_earning.review_count} + 1`,
              updated_at: now,
            },
          });
      } else {
        await transaction
          .insert(freelancer_earning)
          .values({
            freelancer_id: freelancerAccountId,
            review_count: 1,
            rating: rating.toFixed(2),
            job_success_score: jssContribution.toFixed(2),
          })
          .onConflictDoUpdate({
            target: freelancer_earning.freelancer_id,
            set: {
              rating: sql`((${freelancer_earning.rating} * ${freelancer_earning.review_count}) + ${rating}) / (${freelancer_earning.review_count} + 1)`,
              job_success_score: sql`((${freelancer_earning.job_success_score} * ${freelancer_earning.review_count}) + ${jssContribution}) / (${freelancer_earning.review_count} + 1)`,
              review_count: sql`${freelancer_earning.review_count} + 1`,
              updated_at: now,
            },
          });
      }
    } else {
      await transaction
        .insert(client_spents)
        .values({
          client_id: contract.clientId,
          review_count: 1,
          rating: rating.toFixed(2),
        })
        .onConflictDoUpdate({
          target: client_spents.client_id,
          set: {
            rating: sql`((${client_spents.rating} * ${client_spents.review_count}) + ${rating}) / (${client_spents.review_count} + 1)`,
            review_count: sql`${client_spents.review_count} + 1`,
            updated_at: now,
          },
        });
    }

    if (!newlyCompleted) return;

    const [completed] = await transaction
      .update(contracts)
      .set({ status: "COMPLETED", completed_at: now, updated_at: now })
      .where(and(eq(contracts.id, contract.id), eq(contracts.status, "ACTIVE")))
      .returning({ id: contracts.id });
    if (!completed) throw new ApiError(409, "Contract was already finished.");

    if (contract.agencyId) {
      await transaction
        .insert(agency_earning)
        .values({ agency_id: contract.agencyId, completed_jobs: 1 })
        .onConflictDoUpdate({
          target: agency_earning.agency_id,
          set: {
            ongoing_jobs: sql`greatest(${agency_earning.ongoing_jobs} - 1, 0)`,
            completed_jobs: sql`${agency_earning.completed_jobs} + 1`,
            updated_at: now,
          },
        });
    } else {
      await transaction
        .insert(freelancer_earning)
        .values({ freelancer_id: freelancerAccountId, completed_jobs: 1 })
        .onConflictDoUpdate({
          target: freelancer_earning.freelancer_id,
          set: {
            ongoing_jobs: sql`greatest(${freelancer_earning.ongoing_jobs} - 1, 0)`,
            completed_jobs: sql`${freelancer_earning.completed_jobs} + 1`,
            updated_at: now,
          },
        });
    }
    await transaction
      .insert(client_spents)
      .values({ client_id: contract.clientId, completed_contracts: 1 })
      .onConflictDoUpdate({
        target: client_spents.client_id,
        set: {
          ongoing_contracts: sql`greatest(${client_spents.ongoing_contracts} - 1, 0)`,
          completed_contracts: sql`${client_spents.completed_contracts} + 1`,
          updated_at: now,
        },
      });

    if (contract.conversationId) {
      const [message] = await transaction
        .insert(messages)
        .values({
          conversation_id: contract.conversationId,
          sender_id: reviewerId,
          message_type: "SYSTEM_EVENT",
          body: `The contract “${contract.title}” was completed.`,
          event_type: "CONTRACT_COMPLETED",
          event_payload: { contractId: contract.id, title: contract.title },
          created_at: now,
        })
        .returning({ id: messages.id, createdAt: messages.created_at });
      if (message) {
        await transaction
          .update(conversations)
          .set({
            last_message_id: message.id,
            last_message_at: message.createdAt,
            updated_at: now,
          })
          .where(eq(conversations.id, contract.conversationId));
        await transaction
          .update(conversation_participants)
          .set({
            unread_count: sql`${conversation_participants.unread_count} + 1`,
          })
          .where(
            and(
              eq(
                conversation_participants.conversation_id,
                contract.conversationId,
              ),
              participantMatch(
                revieweeId,
                role === "client" ? contract.agencyId : null,
              ),
            ),
          );
      }
    }
  });

  return {
    id: contract.id,
    title: contract.title,
    revieweeId,
    agencyId: role === "client" ? contract.agencyId : null,
    conversationId: contract.conversationId,
    newlyCompleted,
  };
};

export const acceptContract = async (
  contractId: string,
  freelancerId: string,
  agencyId?: string | null,
) => {
  const [offer] = await db
    .select({
      id: contracts.id,
      title: contracts.title,
      status: contracts.status,
      clientId: contracts.client_id,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      identityVerified: accounts.identityVerified,
      conversationId: conversations.id,
      milestoneId: contract_milestones.id,
    })
    .from(contracts)
    .innerJoin(accounts, eq(accounts.auth_id, freelancerId))
    .innerJoin(
      conversations,
      eq(conversations.id, contracts.conversation_id),
    )
    .innerJoin(
      contract_milestones,
      and(
        eq(contract_milestones.contract_id, contracts.id),
        eq(contract_milestones.position, 0),
        isNotNull(contract_milestones.funded_at),
      ),
    )
    .where(
      and(
        eq(contracts.id, contractId),
        agencyId
          ? eq(contracts.agency_id, agencyId)
          : eq(contracts.freelancer_id, freelancerId),
      ),
    )
    .limit(1);

  if (!offer) throw new ApiError(404, "Funded contract offer not found.");
  if (!offer.identityVerified) {
    throw new ApiError(403, "Identity verification is required.");
  }
  if (offer.status !== "PENDING") {
    throw new ApiError(409, "Contract offer has already been handled.");
  }

  const now = new Date();
  await db.transaction(async (transaction) => {
    const [contract] = await transaction
      .update(contracts)
      .set({ status: "ACTIVE", started_at: now, updated_at: now })
      .where(and(eq(contracts.id, offer.id), eq(contracts.status, "PENDING")))
      .returning({ id: contracts.id });
    if (!contract)
      throw new ApiError(409, "Contract offer was already handled.");

    await transaction
      .update(contract_milestones)
      .set({ status: "ACTIVE", updated_at: now })
      .where(eq(contract_milestones.id, offer.milestoneId));

    if (agencyId) {
      await transaction
        .insert(agency_earning)
        .values({ agency_id: agencyId, ongoing_jobs: 1 })
        .onConflictDoUpdate({
          target: agency_earning.agency_id,
          set: {
            ongoing_jobs: sql`${agency_earning.ongoing_jobs} + 1`,
            updated_at: now,
          },
        });
    } else {
      await transaction
        .insert(freelancer_earning)
        .values({ freelancer_id: freelancerId, ongoing_jobs: 1 })
        .onConflictDoUpdate({
          target: freelancer_earning.freelancer_id,
          set: {
            ongoing_jobs: sql`${freelancer_earning.ongoing_jobs} + 1`,
            updated_at: now,
          },
        });
    }
    await transaction
      .insert(client_spents)
      .values({ client_id: offer.clientId, ongoing_contracts: 1 })
      .onConflictDoUpdate({
        target: client_spents.client_id,
        set: {
          ongoing_contracts: sql`${client_spents.ongoing_contracts} + 1`,
          updated_at: now,
        },
      });

    const [message] = await transaction
      .insert(messages)
      .values({
        conversation_id: offer.conversationId,
        sender_id: freelancerId,
        message_type: "SYSTEM_EVENT",
        body: agencyId
          ? "The agency accepted the contract offer. The contract is now active."
          : "The freelancer accepted the contract offer. The contract is now active.",
        event_type: "CONTRACT_ACCEPTED",
        event_payload: { contractId: offer.id, title: offer.title },
      })
      .returning({ id: messages.id, createdAt: messages.created_at });
    if (!message)
      throw new ApiError(500, "Contract message could not be sent.");

    await transaction
      .update(conversations)
      .set({
        last_message_id: message.id,
        last_message_at: message.createdAt,
        updated_at: now,
      })
      .where(eq(conversations.id, offer.conversationId));

    await transaction
      .update(conversation_participants)
      .set({
        unread_count: sql`${conversation_participants.unread_count} + 1`,
      })
      .where(
        and(
          eq(conversation_participants.conversation_id, offer.conversationId),
          eq(conversation_participants.account_id, offer.clientId),
        ),
      );
  });

  await startMilestoneAllocation(offer.milestoneId);
  return { ...offer, freelancerId };
};

export const submitContractMilestone = async (
  contractId: string,
  milestoneId: string,
  freelancerId: string,
  submissionMessage: string,
  submissionDeliveryLink?: string,
  agencyId?: string | null,
) => {
  const [milestone] = await db
    .select({
      contractId: contracts.id,
      contractTitle: contracts.title,
      contractStatus: contracts.status,
      clientId: contracts.client_id,
      milestoneId: contract_milestones.id,
      milestoneTitle: contract_milestones.title,
      milestoneAmount: contract_milestones.amount,
      milestoneStatus: contract_milestones.status,
      fundedAt: contract_milestones.funded_at,
      conversationId: conversations.id,
    })
    .from(contracts)
    .innerJoin(
      contract_milestones,
      eq(contract_milestones.contract_id, contracts.id),
    )
    .innerJoin(
      conversations,
      eq(conversations.id, contracts.conversation_id),
    )
    .where(
      and(
        eq(contracts.id, contractId),
        agencyId
          ? eq(contracts.agency_id, agencyId)
          : eq(contracts.freelancer_id, freelancerId),
        eq(contract_milestones.id, milestoneId),
      ),
    )
    .limit(1);

  if (!milestone) throw new ApiError(404, "Contract milestone not found.");
  if (
    milestone.contractStatus !== "ACTIVE" ||
    milestone.milestoneStatus !== "ACTIVE" ||
    !milestone.fundedAt
  ) {
    throw new ApiError(
      409,
      "Only the active funded milestone can be submitted.",
    );
  }

  // Delivery is only completed on TradeSafe when the client approves (see review),
  // so the inspection clock never runs while work is still under review.
  await startMilestoneAllocation(milestone.milestoneId);

  const now = new Date();
  await db.transaction(async (transaction) => {
    await transaction
      .update(contract_milestones)
      .set({
        submission_message: submissionMessage,
        submission_delivery_link: submissionDeliveryLink ?? null,
        payment_requested_at: now,
        updated_at: now,
      })
      .where(eq(contract_milestones.id, milestone.milestoneId));

    const [message] = await transaction
      .insert(messages)
      .values({
        conversation_id: milestone.conversationId,
        sender_id: freelancerId,
        message_type: "SYSTEM_EVENT",
        body: `Work submitted for “${milestone.milestoneTitle}”.`,
        event_type: "MILESTONE_SUBMITTED",
        event_payload: {
          contractId: milestone.contractId,
          milestoneId: milestone.milestoneId,
          contractTitle: milestone.contractTitle,
          milestoneTitle: milestone.milestoneTitle,
          amount: Number(milestone.milestoneAmount),
          submissionMessage,
          submissionDeliveryLink: submissionDeliveryLink ?? null,
        },
      })
      .returning({ id: messages.id, createdAt: messages.created_at });
    if (!message)
      throw new ApiError(500, "Milestone submission could not be sent.");

    await transaction
      .update(conversations)
      .set({
        last_message_id: message.id,
        last_message_at: message.createdAt,
        updated_at: now,
      })
      .where(eq(conversations.id, milestone.conversationId));
    await transaction
      .update(conversation_participants)
      .set({ unread_count: sql`${conversation_participants.unread_count} + 1` })
      .where(
        and(
          eq(
            conversation_participants.conversation_id,
            milestone.conversationId,
          ),
          eq(conversation_participants.account_id, milestone.clientId),
        ),
      );
  });

  return milestone;
};

export const reviewContractMilestone = async (
  contractId: string,
  milestoneId: string,
  clientId: string,
  action: "APPROVE" | "REQUEST_CHANGES",
  feedback?: string,
  options: {
    releasedByTradeSafe?: boolean;
    /** Approved by the auto-approve job: the client didn't respond in time. */
    autoApproved?: boolean;
  } = {},
) => {
  const [milestone] = await db
    .select({
      contractId: contracts.id,
      contractTitle: contracts.title,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      milestoneId: contract_milestones.id,
      milestoneTitle: contract_milestones.title,
      milestoneAmount: contract_milestones.amount,
      milestoneStatus: contract_milestones.status,
      paymentRequestedAt: contract_milestones.payment_requested_at,
      conversationId: conversations.id,
    })
    .from(contracts)
    .innerJoin(
      contract_milestones,
      eq(contract_milestones.contract_id, contracts.id),
    )
    .innerJoin(
      conversations,
      eq(conversations.id, contracts.conversation_id),
    )
    .where(
      and(
        eq(contracts.id, contractId),
        eq(contracts.client_id, clientId),
        eq(contracts.status, "ACTIVE"),
        eq(contract_milestones.id, milestoneId),
      ),
    )
    .limit(1);

  if (!milestone) throw new ApiError(404, "Contract milestone not found.");
  if (milestone.milestoneStatus !== "ACTIVE" || !milestone.paymentRequestedAt) {
    throw new ApiError(409, "This milestone is not awaiting review.");
  }

  const freelancerAccountId =
    milestone.freelancerId ??
    (milestone.agencyId ? await getAgencyOwnerId(milestone.agencyId) : null);
  if (!freelancerAccountId) {
    throw new ApiError(500, "Contract owner could not be resolved.");
  }

  const approved = action === "APPROVE";

  // Approval completes delivery on TradeSafe, which releases the funds after its
  // inspection period (1 day) or immediately if the client taps TradeSafe's own link.
  // TradeSafe doesn't let the platform accept on the client's behalf. When TradeSafe
  // already released the funds (callback), there's nothing to do there.
  let escrowRelease = false;
  if (approved && !options.releasedByTradeSafe) {
    try {
      escrowRelease = await syncMilestoneAllocation(milestone.milestoneId, "SUBMITTED");
    } catch (error) {
      await logger.error({
        message: "TradeSafe complete delivery failed",
        eventName: "tradesafe.allocation.deliver_failed",
        attributes: {
          "coverpro.milestone_id": milestone.milestoneId,
          "error.message": error instanceof Error ? error.message : String(error),
        },
      });
      throw new ApiError(502, "We couldn't release the escrow for this milestone. Please try again.");
    }
  }

  const now = new Date();
  const grossAmount = Number(milestone.milestoneAmount);
  const platformFeeAmount =
    Math.round(grossAmount * PLATFORM_FEE_RATE * 100) / 100;
  const netAmount = Math.round((grossAmount - platformFeeAmount) * 100) / 100;

  await db.transaction(async (transaction) => {
    const [reviewed] = (await transaction
      .update(contract_milestones)
      .set(
        approved
          ? { status: "COMPLETED", completed_at: now, updated_at: now }
          : { payment_requested_at: null, updated_at: now },
      )
      .where(
        and(
          eq(contract_milestones.id, milestone.milestoneId),
          eq(contract_milestones.status, "ACTIVE"),
          isNotNull(contract_milestones.payment_requested_at),
        ),
      )
      .returning({ id: contract_milestones.id })) as { id: string }[];
    if (!reviewed) throw new ApiError(409, "This milestone was already reviewed.");

    if (approved) {
      if (milestone.agencyId) {
        await transaction
          .insert(agency_earning)
          .values({
            agency_id: milestone.agencyId,
            total_earning: netAmount.toFixed(2),
          })
          .onConflictDoUpdate({
            target: agency_earning.agency_id,
            set: {
              total_earning: sql`${agency_earning.total_earning} + ${netAmount}`,
              updated_at: now,
            },
          });
      } else {
        await transaction
          .insert(freelancer_earning)
          .values({
            freelancer_id: freelancerAccountId,
            total_earning: netAmount.toFixed(2),
          })
          .onConflictDoUpdate({
            target: freelancer_earning.freelancer_id,
            set: {
              total_earning: sql`${freelancer_earning.total_earning} + ${netAmount}`,
              updated_at: now,
            },
          });
      }
      await transaction
        .insert(client_spents)
        .values({
          client_id: clientId,
          total_spent: milestone.milestoneAmount,
        })
        .onConflictDoUpdate({
          target: client_spents.client_id,
          set: {
            total_spent: sql`${client_spents.total_spent} + ${milestone.milestoneAmount}`,
            updated_at: now,
          },
        });
      await transaction.insert(earning_history).values({
        freelancer_id: milestone.agencyId ? null : freelancerAccountId,
        agency_id: milestone.agencyId ?? null,
        contract_id: milestone.contractId,
        milestone_id: milestone.milestoneId,
        amount: grossAmount.toFixed(2),
        platform_fee_amount: platformFeeAmount.toFixed(2),
        description: `Milestone payment for "${milestone.milestoneTitle}"`,
      });
    }

    const reviewMessages = approved
      ? [
          {
            conversation_id: milestone.conversationId,
            sender_id: clientId,
            message_type: "SYSTEM_EVENT" as const,
            body: options.releasedByTradeSafe
              ? `TradeSafe released the payment for “${milestone.milestoneTitle}”.`
              : options.autoApproved
                ? `“${milestone.milestoneTitle}” was approved automatically after ${AUTO_APPROVE_AFTER_DAYS} days without a response.${escrowRelease ? " TradeSafe releases the payment within 1 day." : ""}`
                : escrowRelease
                ? `The client accepted the work for “${milestone.milestoneTitle}”. TradeSafe releases the payment within 1 day.`
                : `The client accepted the work for “${milestone.milestoneTitle}”.`,
            event_type: "MILESTONE_APPROVED",
            event_payload: {
              contractId: milestone.contractId,
              milestoneId: milestone.milestoneId,
              contractTitle: milestone.contractTitle,
              milestoneTitle: milestone.milestoneTitle,
              amount: Number(milestone.milestoneAmount),
            },
            created_at: now,
          },
        ]
      : [
          {
            conversation_id: milestone.conversationId,
            sender_id: clientId,
            message_type: "SYSTEM_EVENT" as const,
            body: `The client requested modifications for “${milestone.milestoneTitle}”.`,
            event_type: "MILESTONE_CHANGES_REQUESTED",
            event_payload: {
              contractId: milestone.contractId,
              milestoneId: milestone.milestoneId,
              contractTitle: milestone.contractTitle,
              milestoneTitle: milestone.milestoneTitle,
              amount: Number(milestone.milestoneAmount),
            },
            created_at: now,
          },
          {
            conversation_id: milestone.conversationId,
            sender_id: clientId,
            message_type: "USER" as const,
            body: feedback!,
            event_type: null,
            event_payload: null,
            created_at: new Date(now.getTime() + 1),
          },
        ];
    const insertedMessages = await transaction
      .insert(messages)
      .values(reviewMessages)
      .returning({ id: messages.id, createdAt: messages.created_at });
    const message = insertedMessages.at(-1);
    if (!message)
      throw new ApiError(500, "Milestone review could not be sent.");

    await transaction
      .update(conversations)
      .set({
        last_message_id: message.id,
        last_message_at: message.createdAt,
        updated_at: now,
      })
      .where(eq(conversations.id, milestone.conversationId));
    await transaction
      .update(conversation_participants)
      .set({
        unread_count: sql`${conversation_participants.unread_count} + ${insertedMessages.length}`,
      })
      .where(
        and(
          eq(
            conversation_participants.conversation_id,
            milestone.conversationId,
          ),
          participantMatch(freelancerAccountId, milestone.agencyId),
        ),
      );
  });

  return { ...milestone, approved, escrowRelease, freelancerId: freelancerAccountId };
};

export const addContractMilestone = async (
  contractId: string,
  clientId: string,
  input: { title: string; amount: number; dueDate: string },
) => {
  const [contract] = await db
    .select({
      id: contracts.id,
      jobId: contracts.job_id,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      status: contracts.status,
      totalAmount: contracts.total_amount,
      jobBudget: job_posts.total_budget,
      jobMilestones: job_posts.milestones,
      conversationId: conversations.id,
      incompleteMilestones: sql<number>`(
        select count(*)::int from contract_milestones incomplete
        where incomplete.contract_id = ${contracts.id}
          and incomplete.status <> 'COMPLETED'
      )`,
      nextPosition: sql<number>`(
        select coalesce(max(existing.position), -1)::int + 1
        from contract_milestones existing
        where existing.contract_id = ${contracts.id}
      )`,
    })
    .from(contracts)
    .leftJoin(job_posts, eq(job_posts.id, contracts.job_id))
    .leftJoin(
      conversations,
      eq(conversations.id, contracts.conversation_id),
    )
    .where(and(eq(contracts.id, contractId), eq(contracts.client_id, clientId)))
    .limit(1);

  if (!contract) throw new ApiError(404, "Contract not found.");
  if (!contract.jobId || !contract.jobMilestones) {
    throw new ApiError(409, "Booked services have a fixed milestone plan.");
  }
  const jobId = contract.jobId;
  const jobMilestones = contract.jobMilestones;
  if (contract.status !== "ACTIVE" || contract.incompleteMilestones > 0) {
    throw new ApiError(
      409,
      "New milestones can be added only after all current milestones are completed.",
    );
  }

  const freelancerAccountId =
    contract.freelancerId ??
    (contract.agencyId ? await getAgencyOwnerId(contract.agencyId) : null);
  if (!freelancerAccountId) {
    throw new ApiError(500, "Contract owner could not be resolved.");
  }

  const now = new Date();
  const result = await db.transaction(async (transaction) => {
    const [milestone] = await transaction
      .insert(contract_milestones)
      .values({
        contract_id: contract.id,
        title: input.title,
        amount: input.amount.toFixed(2),
        due_date: input.dueDate,
        position: contract.nextPosition,
        status: "PENDING",
      })
      .returning({ id: contract_milestones.id });
    if (!milestone) throw new ApiError(500, "Milestone could not be added.");

    const updatedJobMilestones = [
      ...jobMilestones,
      {
        id: milestone.id,
        title: input.title,
        budget: input.amount,
        dueDate: input.dueDate,
      },
    ];
    await transaction
      .update(job_posts)
      .set({
        milestones: updatedJobMilestones,
        total_budget: (Number(contract.jobBudget) + input.amount).toFixed(2),
        updated_at: now,
      })
      .where(eq(job_posts.id, jobId));
    await transaction
      .update(contracts)
      .set({
        total_amount: (Number(contract.totalAmount) + input.amount).toFixed(2),
        updated_at: now,
      })
      .where(eq(contracts.id, contract.id));

    if (!contract.conversationId) {
      return { milestoneId: milestone.id, conversationId: null };
    }
    const [message] = await transaction
      .insert(messages)
      .values({
        conversation_id: contract.conversationId,
        sender_id: clientId,
        message_type: "SYSTEM_EVENT",
        body: `A new milestone was added: “${input.title}”.`,
        event_type: "MILESTONE_ADDED",
        event_payload: {
          contractId: contract.id,
          milestoneId: milestone.id,
          milestoneTitle: input.title,
          amount: input.amount,
          dueDate: input.dueDate,
        },
      })
      .returning({ id: messages.id, createdAt: messages.created_at });
    if (!message) throw new ApiError(500, "Milestone event could not be sent.");
    await transaction
      .update(conversations)
      .set({
        last_message_id: message.id,
        last_message_at: message.createdAt,
        updated_at: now,
      })
      .where(eq(conversations.id, contract.conversationId));
    await transaction
      .update(conversation_participants)
      .set({ unread_count: sql`${conversation_participants.unread_count} + 1` })
      .where(
        and(
          eq(
            conversation_participants.conversation_id,
            contract.conversationId,
          ),
          participantMatch(freelancerAccountId, contract.agencyId),
        ),
      );
    return {
      milestoneId: milestone.id,
      conversationId: contract.conversationId,
    };
  });

  await sendNotification(
    contract.agencyId
      ? {
          agencyId: contract.agencyId,
          type: "MILESTONE_ADDED",
          title: "New contract milestone",
          message: `The client added “${input.title}” to your contract.`,
          link: `/contracts?contractId=${contract.id}`,
          metadata: { contractId: contract.id, milestoneId: result.milestoneId },
        }
      : {
          recipientId: freelancerAccountId,
          type: "MILESTONE_ADDED",
          title: "New contract milestone",
          message: `The client added “${input.title}” to your contract.`,
          link: `/contracts?contractId=${contract.id}`,
          metadata: { contractId: contract.id, milestoneId: result.milestoneId },
        },
  );
  if (result.conversationId)
    await emitConversationUpdate(result.conversationId);

  return {
    id: result.milestoneId,
    title: input.title,
    amount: input.amount,
    dueDate: input.dueDate,
    status: "PENDING" as const,
  };
};

export const createContractFromPayment = async (
  session: Stripe.Checkout.Session,
) => {
  if (
    session.payment_status !== "paid" ||
    session.metadata?.paymentType !== "CONTRACT_MILESTONE"
  ) {
    return;
  }

  const proposalId = session.metadata.proposalId;
  const clientId = session.metadata.clientId;
  if (!proposalId || !clientId) {
    throw new ApiError(400, "Stripe contract metadata is missing.");
  }

  const contractOffer = await loadContractOffer(proposalId, clientId);
  const { offer, amounts } = contractOffer;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  const firstMilestoneAmount = Math.round(amounts[0]! * 100);
  if (
    stripeCustomerId !== offer.stripeCustomerId ||
    session.amount_total !== firstMilestoneAmount ||
    session.currency !== "usd"
  ) {
    throw new ApiError(400, "Stripe contract payment does not match.");
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await insertContractOffer(contractOffer, clientId, {
    milestone: (position) =>
      position === 0
        ? {
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            funded_at: new Date(),
          }
        : {},
  });
};

/**
 * Creates the contract once TradeSafe confirms the whole contract amount is in escrow.
 * Milestone 0 counts as funded (as with Stripe); later milestones are already escrowed
 * and start when the client activates them, without another payment.
 */
export const createContractFromTradeSafe = async (escrow: {
  transactionId: string;
  proposalId: string;
  clientId: string;
  amount: number;
  allocationIds: string[];
}) => {
  const contractOffer = await loadContractOffer(escrow.proposalId, escrow.clientId);
  const { amounts } = contractOffer;

  const expected = amounts.reduce(
    (total: number, amount: number) => total + amount,
    0,
  );
  if (
    Math.round(expected * 100) !== Math.round(escrow.amount * 100) ||
    escrow.allocationIds.length !== amounts.length
  ) {
    throw new ApiError(400, "TradeSafe escrow does not match the contract offer.");
  }

  return insertContractOffer(contractOffer, escrow.clientId, {
    contract: { tradesafe_transaction_id: escrow.transactionId },
    milestone: (position) => ({
      tradesafe_allocation_id: escrow.allocationIds[position],
      funded_at: position === 0 ? new Date() : undefined,
    }),
  });
};

const loadContractOffer = async (proposalId: string, clientId: string) => {
  const [offer] = await db
    .select({
      proposal: proposals,
      job: job_posts,
      stripeCustomerId: accounts.stripe_customer_id,
      conversationId: conversations.id,
    })
    .from(proposals)
    .innerJoin(job_posts, eq(proposals.job_id, job_posts.id))
    .innerJoin(accounts, eq(accounts.auth_id, job_posts.client_id))
    .innerJoin(conversations, eq(conversations.proposal_id, proposals.id))
    .where(and(eq(proposals.id, proposalId), eq(job_posts.client_id, clientId)))
    .limit(1);

  if (!offer) throw new ApiError(404, "Contract offer data not found.");
  const isAgency = offer.proposal.sender_type === "AGENCY";

  const milestones = offer.job.milestones;
  const amounts = milestones.map((milestone) => Number(milestone.budget));
  if (
    !milestones.length ||
    amounts.some((amount) => !Number.isFinite(amount) || amount <= 0)
  ) {
    throw new ApiError(400, "Contract milestones are invalid.");
  }

  return { offer, isAgency, milestones, amounts };
};

type ContractOffer = Awaited<ReturnType<typeof loadContractOffer>>;

const insertContractOffer = async (
  { offer, isAgency, milestones, amounts }: ContractOffer,
  clientId: string,
  payment: {
    contract?: { tradesafe_transaction_id: string };
    milestone: (position: number) => {
      stripe_checkout_session_id?: string;
      stripe_payment_intent_id?: string;
      tradesafe_allocation_id?: string;
      funded_at?: Date;
    };
  },
) => {
  const result = await db.transaction(async (transaction) => {
    const [contract] = await transaction
      .insert(contracts)
      .values({
        ...payment.contract,
        proposal_id: offer.proposal.id,
        job_id: offer.job.id,
        conversation_id: offer.conversationId,
        client_id: clientId,
        freelancer_id: isAgency ? null : offer.proposal.sender_id,
        agency_id: isAgency ? offer.proposal.sender_id : null,
        title: offer.job.title,
        total_amount: amounts
          .reduce((total, amount) => total + amount, 0)
          .toFixed(2),
        status: "PENDING",
      })
      .onConflictDoNothing({ target: contracts.proposal_id })
      .returning({ id: contracts.id });

    if (!contract) return;

    await transaction.insert(contract_milestones).values(
      milestones.map((milestone, position) => ({
        contract_id: contract.id,
        title: milestone.title,
        amount: amounts[position]!.toFixed(2),
        due_date: milestone.dueDate,
        position,
        ...payment.milestone(position),
      })),
    );

    await transaction
      .update(accounts)
      .set({ paymentMethodVerified: true, updated_at: new Date() })
      .where(eq(accounts.auth_id, clientId));

    const [message] = await transaction
      .insert(messages)
      .values({
        conversation_id: offer.conversationId,
        sender_id: clientId,
        message_type: "SYSTEM_EVENT",
        body: "Contract offer sent",
        event_type: "CONTRACT_OFFER",
        event_payload: {
          contractId: contract.id,
          proposalId: offer.proposal.id,
          title: offer.job.title,
          firstMilestone: {
            title: milestones[0]!.title,
            amount: amounts[0],
          },
        },
      })
      .returning({ id: messages.id, createdAt: messages.created_at });

    if (!message)
      throw new ApiError(500, "Contract message could not be sent.");

    await transaction
      .update(conversations)
      .set({
        last_message_id: message.id,
        last_message_at: message.createdAt,
        updated_at: new Date(),
      })
      .where(eq(conversations.id, offer.conversationId));

    await transaction
      .update(conversation_participants)
      .set({
        unread_count: sql`${conversation_participants.unread_count} + 1`,
      })
      .where(
        and(
          eq(conversation_participants.conversation_id, offer.conversationId),
          ne(conversation_participants.participant_type, "CLIENT"),
        ),
      );

    return { contractId: contract.id };
  });

  // Already created (duplicate payment event): nothing more to do.
  if (!result) return null;

  await sendNotification(
    isAgency
      ? {
          agencyId: offer.proposal.sender_id,
          type: "CONTRACT_OFFER",
          title: "New contract offer",
          message: `A client sent you a contract offer for “${offer.job.title}”.`,
          link: `/messages?conversationId=${offer.conversationId}`,
          metadata: {
            contractId: result.contractId,
            proposalId: offer.proposal.id,
          },
        }
      : {
          recipientId: offer.proposal.sender_id,
          type: "CONTRACT_OFFER",
          title: "New contract offer",
          message: `A client sent you a contract offer for “${offer.job.title}”.`,
          link: `/messages?conversationId=${offer.conversationId}`,
          metadata: {
            contractId: result.contractId,
            proposalId: offer.proposal.id,
          },
        },
  );

  await emitConversationUpdate(offer.conversationId, clientId);
  return result.contractId;
};

/**
 * Creates the contract for a booked service once TradeSafe confirms the full amount is in
 * escrow. The pro already accepted the booking, so the contract starts ACTIVE with its
 * first milestone running; later milestones are escrowed and start when the client
 * activates them.
 */
export const createContractFromBooking = async (escrow: {
  transactionId: string;
  bookingId: string;
  clientId: string;
  amount: number;
  allocationIds: string[];
}) => {
  const [booking] = (await db
    .select()
    .from(service_bookings)
    .where(
      and(
        eq(service_bookings.id, escrow.bookingId),
        eq(service_bookings.client_id, escrow.clientId),
      ),
    )
    .limit(1)) as (typeof service_bookings.$inferSelect)[];
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (!booking.conversation_id) {
    throw new ApiError(409, "Booking has no chat to post the contract to.");
  }
  const conversationId = booking.conversation_id;

  const milestones = booking.milestones;
  const amounts = milestones.map((milestone: ListingMilestone) => Number(milestone.amount));
  const expected = amounts.reduce((total: number, amount: number) => total + amount, 0);
  if (
    !milestones.length ||
    Math.round(expected * 100) !== Math.round(escrow.amount * 100) ||
    escrow.allocationIds.length !== milestones.length
  ) {
    throw new ApiError(400, "TradeSafe escrow does not match the booking.");
  }

  // Due dates run back to back from today, using each milestone's days.
  const now = new Date();
  let elapsedDays = 0;
  const dueDates = milestones.map((milestone: ListingMilestone) => {
    elapsedDays += milestone.days;
    return new Date(now.getTime() + elapsedDays * DAY_MS).toISOString().slice(0, 10);
  });

  const result = await db.transaction(async (transaction) => {
    const [contract] = (await transaction
      .insert(contracts)
      .values({
        booking_id: booking.id,
        conversation_id: conversationId,
        client_id: booking.client_id,
        freelancer_id: booking.freelancer_id,
        agency_id: booking.agency_id,
        title: booking.title,
        total_amount: expected.toFixed(2),
        status: "ACTIVE",
        started_at: now,
        tradesafe_transaction_id: escrow.transactionId,
      })
      .onConflictDoNothing({ target: contracts.booking_id })
      .returning({ id: contracts.id })) as { id: string }[];
    if (!contract) return null;

    await transaction.insert(contract_milestones).values(
      milestones.map((milestone: ListingMilestone, position: number) => ({
        contract_id: contract.id,
        title: milestone.title,
        amount: amounts[position]!.toFixed(2),
        due_date: dueDates[position]!,
        position,
        tradesafe_allocation_id: escrow.allocationIds[position],
        status: position === 0 ? ("ACTIVE" as const) : ("PENDING" as const),
        funded_at: position === 0 ? now : undefined,
      })),
    );

    await transaction
      .update(service_bookings)
      .set({ status: "PAID", updated_at: now })
      .where(eq(service_bookings.id, booking.id));

    await transaction
      .update(accounts)
      .set({ paymentMethodVerified: true, updated_at: now })
      .where(eq(accounts.auth_id, booking.client_id));

    if (booking.agency_id) {
      await transaction
        .insert(agency_earning)
        .values({ agency_id: booking.agency_id, ongoing_jobs: 1 })
        .onConflictDoUpdate({
          target: agency_earning.agency_id,
          set: { ongoing_jobs: sql`${agency_earning.ongoing_jobs} + 1`, updated_at: now },
        });
    } else if (booking.freelancer_id) {
      await transaction
        .insert(freelancer_earning)
        .values({ freelancer_id: booking.freelancer_id, ongoing_jobs: 1 })
        .onConflictDoUpdate({
          target: freelancer_earning.freelancer_id,
          set: { ongoing_jobs: sql`${freelancer_earning.ongoing_jobs} + 1`, updated_at: now },
        });
    }
    await transaction
      .insert(client_spents)
      .values({ client_id: booking.client_id, ongoing_contracts: 1 })
      .onConflictDoUpdate({
        target: client_spents.client_id,
        set: { ongoing_contracts: sql`${client_spents.ongoing_contracts} + 1`, updated_at: now },
      });

    const [message] = (await transaction
      .insert(messages)
      .values({
        conversation_id: conversationId,
        sender_id: booking.client_id,
        message_type: "SYSTEM_EVENT",
        body: "Payment is safely in escrow. The contract is now active.",
        event_type: "CONTRACT_ACCEPTED",
        event_payload: { contractId: contract.id, title: booking.title },
      })
      .returning({ id: messages.id, createdAt: messages.created_at })) as {
      id: string;
      createdAt: Date;
    }[];
    if (!message) throw new ApiError(500, "Contract message could not be sent.");

    await transaction
      .update(conversations)
      .set({ last_message_id: message.id, last_message_at: message.createdAt, updated_at: now })
      .where(eq(conversations.id, conversationId));
    await transaction
      .update(conversation_participants)
      .set({ unread_count: sql`${conversation_participants.unread_count} + 1` })
      .where(
        and(
          eq(conversation_participants.conversation_id, conversationId),
          ne(conversation_participants.participant_type, "CLIENT"),
        ),
      );

    return { contractId: contract.id };
  });

  // Already created (retried callback).
  if (!result) return null;

  const proNotification = {
    type: "CONTRACT_STARTED",
    title: "Booking paid – contract started",
    message: `The client paid “${booking.title}” into escrow. You can start the first milestone.`,
    link: `/contracts?contractId=${result.contractId}`,
    metadata: { contractId: result.contractId, bookingId: booking.id },
  };
  await sendNotification(
    booking.agency_id
      ? { ...proNotification, agencyId: booking.agency_id }
      : { ...proNotification, recipientId: booking.freelancer_id! },
  );
  await sendNotification({
    recipientId: booking.client_id,
    type: "CONTRACT_STARTED",
    title: "Payment received",
    message: `Your payment for “${booking.title}” is in escrow and the contract has started.`,
    link: `/contracts?contractId=${result.contractId}`,
    metadata: { contractId: result.contractId, bookingId: booking.id },
  });

  const [firstMilestone] = (await db
    .select({ id: contract_milestones.id })
    .from(contract_milestones)
    .where(
      and(
        eq(contract_milestones.contract_id, result.contractId),
        eq(contract_milestones.position, 0),
      ),
    )
    .limit(1)) as { id: string }[];
  if (firstMilestone) await startMilestoneAllocation(firstMilestone.id);

  await emitConversationUpdate(conversationId, booking.client_id);
  return result.contractId;
};
