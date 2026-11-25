import { Router } from "express";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import {
  declineInvitationHandler,
  getInvitedJobsHandler,
  getReceivedInvitationsHandler,
  inviteToJobHandler,
} from "./invitations.controller.js";

export const invitationRouter = Router();

// Client
invitationRouter.post("/", isAuthenticated, inviteToJobHandler);
invitationRouter.get("/sent", isAuthenticated, getInvitedJobsHandler);
// Pro
invitationRouter.get("/received", isAuthenticated, getReceivedInvitationsHandler);
invitationRouter.post("/:id/decline", isAuthenticated, declineInvitationHandler);
