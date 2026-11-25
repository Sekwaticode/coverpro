import { createClerkClient } from "@clerk/backend";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../database/client.js";
import {
  agency_metadata,
  freelancer_metadata,
  job_invitations,
  job_posts,
} from "../../database/schema.js";
import { sendNotification } from "../../events/publisher.js";
import { ApiError } from "../../utils/api-error.js";
import { getAgencyIdForMember } from "../agency/agency.service.js";

export type InvitationTarget =
  | { kind: "freelancer"; profileId: string }
  | { kind: "agency"; agencyId: string };

const clientName = async (clientId: string) => {
  try {
    const user = await createClerkClient({ secretKey: env.clerkSecretKey }).users.getUser(
      clientId,
    );
    return user.fullName || "A client";
  } catch {
    return "A client";
  }
};

/** Client invites a pro (by freelancer profile ID) or an agency to one of their published jobs. */
export const createJobInvitation = async (
  clientId: string,
  jobId: string,
  target: InvitationTarget,
  message: string | null,
) => {
  const [job] = await db
    .select({ id: job_posts.id, title: job_posts.title, status: job_posts.status })
    .from(job_posts)
    .where(and(eq(job_posts.id, jobId), eq(job_posts.client_id, clientId)))
    .limit(1);
  if (!job) throw new ApiError(404, "Job post not found.");
  if (job.status !== "PUBLISHED") {
    throw new ApiError(409, "Only published jobs can receive invitations.");
  }

  let recipient: { freelancerId: string } | { agencyId: string };
  if (target.kind === "freelancer") {
    const [freelancer] = await db
      .select({ authId: freelancer_metadata.auth_id })
      .from(freelancer_metadata)
      .where(eq(freelancer_metadata.id, target.profileId))
      .limit(1);
    if (!freelancer) throw new ApiError(404, "Pro not found.");
    recipient = { freelancerId: freelancer.authId };
  } else {
    const [agency] = await db
      .select({ id: agency_metadata.id })
      .from(agency_metadata)
      .where(eq(agency_metadata.id, target.agencyId))
      .limit(1);
    if (!agency) throw new ApiError(404, "Agency not found.");
    recipient = { agencyId: agency.id };
  }

  const [invitation] = await db
    .insert(job_invitations)
    .values({
      job_id: job.id,
      client_id: clientId,
      freelancer_id: "freelancerId" in recipient ? recipient.freelancerId : null,
      agency_id: "agencyId" in recipient ? recipient.agencyId : null,
      message,
    })
    .onConflictDoNothing()
    .returning();
  if (!invitation) {
    throw new ApiError(409, "You've already invited them to this job.");
  }

  const name = await clientName(clientId);
  const notification = {
    type: "JOB_INVITATION",
    title: "You're invited to a job",
    message: `${name} invited you to apply to “${job.title}”.`,
    metadata: { invitationId: invitation.id, jobId: job.id },
  };
  await sendNotification(
    "freelancerId" in recipient
      ? { ...notification, recipientId: recipient.freelancerId, link: "/job-invitations" }
      : { ...notification, agencyId: recipient.agencyId, link: `/jobs/${job.id}` },
  );

  return invitation;
};

/** Which of a client's jobs a given pro or agency has already been invited to. */
export const getInvitedJobIds = async (clientId: string, target: InvitationTarget) => {
  const targetCondition =
    target.kind === "agency"
      ? eq(job_invitations.agency_id, target.agencyId)
      : inArray(
          job_invitations.freelancer_id,
          db
            .select({ authId: freelancer_metadata.auth_id })
            .from(freelancer_metadata)
            .where(eq(freelancer_metadata.id, target.profileId)),
        );

  const rows = await db
    .select({ jobId: job_invitations.job_id })
    .from(job_invitations)
    .where(and(eq(job_invitations.client_id, clientId), targetCondition));
  return (rows as { jobId: string }[]).map((row) => row.jobId);
};

type ReceivedRow = {
  id: string;
  status: string;
  message: string | null;
  createdAt: Date;
  clientId: string;
  forAgency: string | null;
  job: {
    id: string;
    title: string;
    status: string;
    totalBudget: string;
    expectedDuration: string;
    skills: string[];
  };
};

/** Invitations received by a freelancer, plus any sent to the agency they belong to. */
export const getReceivedInvitations = async (freelancerId: string) => {
  const agencyId = await getAgencyIdForMember(freelancerId);
  const rows: ReceivedRow[] = await db
    .select({
      id: job_invitations.id,
      status: job_invitations.status,
      message: job_invitations.message,
      createdAt: job_invitations.created_at,
      clientId: job_invitations.client_id,
      forAgency: job_invitations.agency_id,
      job: {
        id: job_posts.id,
        title: job_posts.title,
        status: job_posts.status,
        totalBudget: job_posts.total_budget,
        expectedDuration: job_posts.expected_duration,
        skills: job_posts.skills,
      },
    })
    .from(job_invitations)
    .innerJoin(job_posts, eq(job_posts.id, job_invitations.job_id))
    .where(
      agencyId
        ? or(
            eq(job_invitations.freelancer_id, freelancerId),
            eq(job_invitations.agency_id, agencyId),
          )
        : eq(job_invitations.freelancer_id, freelancerId),
    )
    .orderBy(desc(job_invitations.created_at));

  const names = new Map<string, string>();
  await Promise.all(
    [...new Set(rows.map((row) => row.clientId))].map(async (id) =>
      names.set(id, await clientName(id)),
    ),
  );

  return rows.map(({ clientId, forAgency, ...row }) => ({
    ...row,
    clientName: names.get(clientId) ?? "A client",
    forAgency: forAgency !== null,
    job: { ...row.job, totalBudget: Number(row.job.totalBudget) },
  }));
};

export const declineInvitation = async (freelancerId: string, invitationId: string) => {
  const [updated] = await db
    .update(job_invitations)
    .set({ status: "DECLINED", responded_at: new Date() })
    .where(
      and(
        eq(job_invitations.id, invitationId),
        eq(job_invitations.freelancer_id, freelancerId),
        eq(job_invitations.status, "PENDING"),
      ),
    )
    .returning({ id: job_invitations.id });
  if (!updated) throw new ApiError(404, "Invitation not found or already answered.");
};

/** Called after a proposal is submitted: an invitation to that job counts as accepted. */
export const markInvitationApplied = async (
  jobId: string,
  sender: { freelancerId: string } | { agencyId: string },
) => {
  await db
    .update(job_invitations)
    .set({ status: "APPLIED", responded_at: new Date() })
    .where(
      and(
        eq(job_invitations.job_id, jobId),
        eq(job_invitations.status, "PENDING"),
        "freelancerId" in sender
          ? eq(job_invitations.freelancer_id, sender.freelancerId)
          : eq(job_invitations.agency_id, sender.agencyId),
      ),
    );
};
