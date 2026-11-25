import { RequestHandler } from "express";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireFreelancer } from "../freelancer/freelancer.controller.js";
import {
  createJobInvitation,
  declineInvitation,
  getInvitedJobIds,
  getReceivedInvitations,
  type InvitationTarget,
} from "./invitations.service.js";

const requireClient = (request: Parameters<RequestHandler>[0]) => {
  if (!request.auth) throw new ApiError(401, "Authentication is required.");
  if (request.auth.role !== "client") {
    throw new ApiError(403, "A client account is required.");
  }
  return request.auth;
};

const readTarget = (source: Record<string, unknown>): InvitationTarget => {
  const freelancerId = typeof source.freelancerId === "string" ? source.freelancerId.trim() : "";
  const agencyId = typeof source.agencyId === "string" ? source.agencyId.trim() : "";
  if (Boolean(freelancerId) === Boolean(agencyId)) {
    throw new ApiError(400, "Choose either a pro or an agency to invite.");
  }
  return freelancerId
    ? { kind: "freelancer", profileId: freelancerId }
    : { kind: "agency", agencyId };
};

export const inviteToJobHandler: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireClient(request);
  const body = (request.body ?? {}) as Record<string, unknown>;
  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  if (!jobId) throw new ApiError(400, "Choose a job.");
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim().slice(0, 1000)
      : null;

  const invitation = await createJobInvitation(auth.userId, jobId, readTarget(body), message);
  response.status(201).json({ success: true, message: "Invitation sent.", data: invitation });
});

export const getInvitedJobsHandler: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireClient(request);
  const jobIds = await getInvitedJobIds(
    auth.userId,
    readTarget(request.query as Record<string, unknown>),
  );
  response.status(200).json({ success: true, message: "Invited jobs retrieved.", data: jobIds });
});

export const getReceivedInvitationsHandler: RequestHandler = asyncHandler(
  async (request, response) => {
    const auth = requireFreelancer(request);
    const invitations = await getReceivedInvitations(auth.userId);
    response
      .status(200)
      .json({ success: true, message: "Invitations retrieved.", data: invitations });
  },
);

export const declineInvitationHandler: RequestHandler = asyncHandler(
  async (request, response) => {
    const auth = requireFreelancer(request);
    const id = typeof request.params.id === "string" ? request.params.id : "";
    await declineInvitation(auth.userId, id);
    response.status(200).json({ success: true, message: "Invitation declined.", data: null });
  },
);
