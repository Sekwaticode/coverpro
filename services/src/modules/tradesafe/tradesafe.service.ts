import { and, eq } from "drizzle-orm";
import { logger } from "../../config/logger.js";
import { redis } from "../../config/redis.js";
import { db } from "../../database/client.js";
import {
  contract_milestones,
  contracts,
  tradesafe_transactions,
} from "../../database/schema.js";
import { sendNotification } from "../../events/publisher.js";
import { emitConversationUpdate } from "../messaging/messaging.socket.js";
import {
  createContractFromBooking,
  createContractFromTradeSafe,
  reviewContractMilestone,
} from "../contracts/contracts.service.js";
import type { TradeSafeTransaction } from "./tradesafe.api.js";

export { getTradeSafeTransaction } from "./tradesafe.api.js";

const PROCESSED_TTL_SECONDS = 60 * 60 * 24 * 7;

const processedKey = (transactionId: string, state: string) =>
  `tradesafe:callback:${transactionId}:${state}`;

export const wasCallbackProcessed = async (
  transactionId: string,
  state: string,
): Promise<boolean> =>
  (await redis.exists(processedKey(transactionId, state))) === 1;

export const markCallbackProcessed = async (
  transactionId: string,
  state: string,
): Promise<void> => {
  await redis.set(processedKey(transactionId, state), "1", {
    expiration: { type: "EX", value: PROCESSED_TTL_SECONDS },
  });
};

/** Contract offer escrow is fully paid: create the contract (once). */
const onFundsReceived = async (
  transaction: TradeSafeTransaction,
  escrow: typeof tradesafe_transactions.$inferSelect,
) => {
  if (escrow.contract_id) return;

  const escrowed = transaction.allocations.reduce(
    (total, allocation) => total + Number(allocation.value),
    0,
  );

  const payment = {
    transactionId: transaction.id,
    clientId: escrow.client_id,
    amount: escrowed,
    allocationIds: escrow.allocation_ids,
  };
  // Escrow comes from either a booked service or a job proposal.
  const created = escrow.booking_id
    ? await createContractFromBooking({ ...payment, bookingId: escrow.booking_id })
    : escrow.proposal_id
      ? await createContractFromTradeSafe({ ...payment, proposalId: escrow.proposal_id })
      : null;

  const contractId =
    created ??
    // Contract already existed (e.g. a retried callback): link to it.
    (
      await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(eq(contracts.tradesafe_transaction_id, transaction.id))
        .limit(1)
    )[0]?.id ??
    null;

  if (contractId) {
    await db
      .update(tradesafe_transactions)
      .set({ contract_id: contractId, updated_at: new Date() })
      .where(eq(tradesafe_transactions.id, escrow.id));
  }
};

/**
 * Callback dedupe key: the transaction state alone isn't enough, because individual
 * milestones (allocations) change while the transaction stays e.g. INITIATED.
 */
export const callbackFingerprint = (transaction: TradeSafeTransaction) =>
  [transaction.state, ...transaction.allocations.map((a) => `${a.id}=${a.state}`)].join("|");

const findContractId = async (transactionId: string) =>
  (
    (await db
      .select({ id: contracts.id })
      .from(contracts)
      .where(eq(contracts.tradesafe_transaction_id, transactionId))
      .limit(1)) as { id: string }[]
  )[0]?.id ?? null;

type ContractMilestoneRow = {
  milestoneId: string;
  allocationId: string | null;
  status: string;
  paymentRequestedAt: Date | null;
  title: string;
  contractTitle: string;
  clientId: string;
  freelancerId: string | null;
  agencyId: string | null;
  conversationId: string | null;
};

const loadContractMilestones = async (contractId: string): Promise<ContractMilestoneRow[]> =>
  (await db
    .select({
      milestoneId: contract_milestones.id,
      allocationId: contract_milestones.tradesafe_allocation_id,
      status: contract_milestones.status,
      paymentRequestedAt: contract_milestones.payment_requested_at,
      title: contract_milestones.title,
      contractTitle: contracts.title,
      clientId: contracts.client_id,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      conversationId: contracts.conversation_id,
    })
    .from(contract_milestones)
    .innerJoin(contracts, eq(contracts.id, contract_milestones.contract_id))
    .where(eq(contract_milestones.contract_id, contractId))) as ContractMilestoneRow[];

const RELEASED_ALLOCATION_STATES = new Set(["DELIVERED", "FUNDS_RELEASED"]);

/**
 * TradeSafe can release a milestone without CoverPro asking (the client accepted via
 * TradeSafe's email/SMS link, or the inspection period ran out). Record those as
 * approved so CoverPro matches escrow.
 */
const syncReleasedMilestones = async (transaction: TradeSafeTransaction, contractId: string) => {
  const milestones = await loadContractMilestones(contractId);
  for (const allocation of transaction.allocations) {
    if (!RELEASED_ALLOCATION_STATES.has(allocation.state)) continue;
    const milestone = milestones.find((item) => item.allocationId === allocation.id);
    if (!milestone) continue;

    // Approved in CoverPro and now actually paid out: let the pro know. (The callback
    // fingerprint includes allocation states, so this fires once per release.)
    if (allocation.state === "FUNDS_RELEASED" && milestone.status === "COMPLETED") {
      const released = {
        type: "PAYMENT_RELEASED",
        title: "Payment released",
        message: `TradeSafe released your payment for “${milestone.title}” to your bank account.`,
        link: `/contracts?contractId=${contractId}`,
        metadata: { contractId, milestoneId: milestone.milestoneId },
      };
      await sendNotification(
        milestone.agencyId
          ? { ...released, agencyId: milestone.agencyId }
          : { ...released, recipientId: milestone.freelancerId! },
      );
      continue;
    }

    // Released by TradeSafe before the client approved in CoverPro: record the approval.
    if (milestone.status !== "ACTIVE" || !milestone.paymentRequestedAt) continue;

    let result;
    try {
      result = await reviewContractMilestone(
        contractId,
        milestone.milestoneId,
        milestone.clientId,
        "APPROVE",
        undefined,
        { releasedByTradeSafe: true },
      );
    } catch {
      // Approved in the meantime (client or auto-approve): nothing left to record.
      continue;
    }

    const notification = {
      type: "MILESTONE_APPROVED",
      title: "Milestone paid",
      message: `TradeSafe released the payment for “${milestone.title}”.`,
      link: `/contracts?contractId=${contractId}`,
      metadata: { contractId, milestoneId: milestone.milestoneId },
    };
    await sendNotification(
      milestone.agencyId
        ? { ...notification, agencyId: milestone.agencyId }
        : { ...notification, recipientId: result.freelancerId },
    );
    await sendNotification({ ...notification, recipientId: milestone.clientId });
    if (milestone.conversationId) await emitConversationUpdate(milestone.conversationId);
  }
};

const REFUND_STATES = new Set(["CANCELED", "REFUNDED", "ADMIN_CANCELED", "ADMIN_REFUNDED"]);
const DISPUTE_STATES = new Set(["DISPUTED", "DISPUTED_EXTENDED", "DISPUTED_RENEGOTIATE"]);

/** Disputes and refunds are handled by TradeSafe; make sure both sides know. */
const notifyEscrowProblems = async (transaction: TradeSafeTransaction, contractId: string) => {
  const disputed =
    DISPUTE_STATES.has(transaction.state) ||
    transaction.allocations.some((allocation) => allocation.state === "DISPUTED");
  const refunded = REFUND_STATES.has(transaction.state);
  if (!disputed && !refunded) return;

  const [milestone] = await loadContractMilestones(contractId);
  if (!milestone) return;
  const notification = {
    type: refunded ? "ESCROW_REFUNDED" : "ESCROW_DISPUTED",
    title: refunded ? "Escrow refunded" : "Escrow disputed",
    message: refunded
      ? `The escrow for “${milestone.contractTitle}” was cancelled and refunded by TradeSafe.`
      : `A dispute was opened on “${milestone.contractTitle}”. TradeSafe will contact both parties.`,
    link: `/contracts?contractId=${contractId}`,
    metadata: { contractId, tradesafeState: transaction.state },
  };
  await sendNotification({ ...notification, recipientId: milestone.clientId });
  await sendNotification(
    milestone.agencyId
      ? { ...notification, agencyId: milestone.agencyId }
      : { ...notification, recipientId: milestone.freelancerId! },
  );
};

/**
 * Acts on a transaction whose state was confirmed with TradeSafe's API.
 */
export const handleTradeSafeTransactionUpdate = async (
  transaction: TradeSafeTransaction,
): Promise<void> => {
  const attributes = {
    "tradesafe.transaction_id": transaction.id,
    "tradesafe.reference": transaction.reference ?? "",
    "tradesafe.state": transaction.state,
    "tradesafe.allocation_state": transaction.allocations[0]?.state ?? "",
  };

  const [escrow] = await db
    .update(tradesafe_transactions)
    .set({ state: transaction.state, updated_at: new Date() })
    .where(and(eq(tradesafe_transactions.transaction_id, transaction.id)))
    .returning();

  if (!escrow) {
    // Not created by CoverPro's contract flow (e.g. the sandbox test script).
    await logger.info({
      message: "TradeSafe transaction updated (not linked to a contract offer)",
      eventName: "tradesafe.transaction.updated",
      attributes,
    });
    return;
  }

  if (transaction.state === "FUNDS_RECEIVED") {
    await onFundsReceived(transaction, escrow);
  }
  // FUNDS_DEPOSITED: manual EFT not cleared yet; nothing to do until FUNDS_RECEIVED.

  const contractId = escrow.contract_id ?? (await findContractId(transaction.id));
  if (contractId) {
    await syncReleasedMilestones(transaction, contractId);
    await notifyEscrowProblems(transaction, contractId);
  }

  await logger.info({
    message: "TradeSafe transaction updated",
    eventName: "tradesafe.transaction.updated",
    attributes: {
      ...attributes,
      "coverpro.proposal_id": escrow.proposal_id ?? "",
      "coverpro.booking_id": escrow.booking_id ?? "",
    },
  });
};
