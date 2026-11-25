/**
 * Auto-approves submitted milestones the client hasn't reviewed within
 * AUTO_APPROVE_AFTER_DAYS, so pros aren't left waiting on unresponsive clients.
 * The clock is the latest submission (payment_requested_at): requesting changes clears
 * it, and resubmitting starts it again. A reminder goes to the client a day before.
 */
import cron from "node-cron";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { AUTO_APPROVE_AFTER_DAYS } from "../../config/constants.js";
import { logger } from "../../config/logger.js";
import { redis } from "../../config/redis.js";
import { db } from "../../database/client.js";
import { contract_milestones, contracts } from "../../database/schema.js";
import { sendNotification } from "../../events/publisher.js";
import { emitConversationUpdate } from "../messaging/messaging.socket.js";
import { reviewContractMilestone } from "./contracts.service.js";

const CRON_EXPRESSION = "15 * * * *"; // hourly, offset from the payout job
const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_TTL_SECONDS = 60 * 60 * 24 * 14;

type AwaitingReview = {
  contractId: string;
  contractTitle: string;
  clientId: string;
  freelancerId: string | null;
  agencyId: string | null;
  milestoneId: string;
  milestoneTitle: string;
  submittedAt: Date;
};

/** Submitted milestones awaiting the client, submitted on or before `cutoff`. */
const findAwaitingReview = async (cutoff: Date): Promise<AwaitingReview[]> =>
  (await db
    .select({
      contractId: contracts.id,
      contractTitle: contracts.title,
      clientId: contracts.client_id,
      freelancerId: contracts.freelancer_id,
      agencyId: contracts.agency_id,
      milestoneId: contract_milestones.id,
      milestoneTitle: contract_milestones.title,
      submittedAt: contract_milestones.payment_requested_at,
    })
    .from(contract_milestones)
    .innerJoin(contracts, eq(contracts.id, contract_milestones.contract_id))
    .where(
      and(
        eq(contracts.status, "ACTIVE"),
        eq(contract_milestones.status, "ACTIVE"),
        isNotNull(contract_milestones.payment_requested_at),
        lte(contract_milestones.payment_requested_at, cutoff),
      ),
    )) as AwaitingReview[];

const sendReminders = async (now: number) => {
  const due = await findAwaitingReview(new Date(now - (AUTO_APPROVE_AFTER_DAYS - 1) * DAY_MS));
  let sent = 0;
  for (const milestone of due) {
    // One reminder per submission (the key includes the submission time).
    const key = `auto-approve:reminded:${milestone.milestoneId}:${milestone.submittedAt.getTime()}`;
    const fresh = await redis.set(key, "1", {
      condition: "NX",
      expiration: { type: "EX", value: REMINDER_TTL_SECONDS },
    });
    if (fresh !== "OK") continue;
    await sendNotification({
      recipientId: milestone.clientId,
      type: "MILESTONE_AUTO_APPROVE_SOON",
      title: "Review submitted work",
      message: `“${milestone.milestoneTitle}” will be approved automatically tomorrow if you don't accept it or request changes.`,
      link: `/contracts?contractId=${milestone.contractId}`,
      metadata: { contractId: milestone.contractId, milestoneId: milestone.milestoneId },
    });
    sent += 1;
  }
  return sent;
};

export const processAutoApprovals = async () => {
  const now = Date.now();
  const reminded = await sendReminders(now);
  const due = await findAwaitingReview(new Date(now - AUTO_APPROVE_AFTER_DAYS * DAY_MS));

  let approved = 0;
  let failed = 0;
  for (const milestone of due) {
    try {
      const result = await reviewContractMilestone(
        milestone.contractId,
        milestone.milestoneId,
        milestone.clientId,
        "APPROVE",
        undefined,
        { autoApproved: true },
      );
      approved += 1;

      const release = result.escrowRelease ? " TradeSafe releases the payment within 1 day." : "";
      const notification = {
        type: "MILESTONE_APPROVED",
        title: "Milestone approved automatically",
        link: `/contracts?contractId=${milestone.contractId}`,
        metadata: { contractId: milestone.contractId, milestoneId: milestone.milestoneId },
      };
      await sendNotification({
        ...notification,
        recipientId: milestone.clientId,
        message: `“${milestone.milestoneTitle}” was approved automatically after ${AUTO_APPROVE_AFTER_DAYS} days.${release}`,
      });
      const proMessage = `Your work for “${milestone.milestoneTitle}” was approved automatically after ${AUTO_APPROVE_AFTER_DAYS} days.${release}`;
      await sendNotification(
        milestone.agencyId
          ? { ...notification, agencyId: milestone.agencyId, message: proMessage }
          : { ...notification, recipientId: result.freelancerId, message: proMessage },
      );
      if (result.conversationId) await emitConversationUpdate(result.conversationId);
    } catch (error) {
      // e.g. reviewed in the meantime (409) or TradeSafe unavailable: retried next hour.
      failed += 1;
      await logger.warn({
        message: "Milestone auto-approve failed",
        eventName: "milestone.auto_approve.failed",
        attributes: {
          "coverpro.milestone_id": milestone.milestoneId,
          "error.message": error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  if (reminded || approved || failed) {
    await logger.info({
      message: "Milestone auto-approve run",
      eventName: "milestone.auto_approve.run",
      attributes: { "task.reminded": reminded, "task.approved": approved, "task.failed": failed },
    });
  }
  return { reminded, approved, failed };
};

export const startAutoApproveCron = () => {
  cron.schedule(
    CRON_EXPRESSION,
    async () => {
      try {
        await processAutoApprovals();
      } catch (error) {
        await logger.error({
          message: "Scheduled task failed",
          eventName: "task.failed",
          attributes: {
            "task.name": "milestone-auto-approve",
            "error.type": error instanceof Error ? error.name : "UnknownError",
          },
        });
        console.error("[auto-approve] Cron run threw unexpectedly:", error);
      }
    },
    { name: "milestone-auto-approve", noOverlap: true },
  );
  console.log(
    `[auto-approve] Hourly job scheduled (${CRON_EXPRESSION}); approves after ${AUTO_APPROVE_AFTER_DAYS} days.`,
  );
};
