import { Router } from "express";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { resolveProOwner } from "../listings/listings.owner.js";
import { tradesafeCallback } from "./tradesafe.controller.js";
import {
  getPayoutDetails,
  hasPayoutDetails,
  parsePayoutDetails,
  savePayoutDetails,
} from "./tradesafe.payouts.js";

export const tradesafeRouter = Router();

tradesafeRouter.post("/callback", tradesafeCallback);

// Pro / agency payout details (agency dashboard adds ?scope=agency).
tradesafeRouter.get(
  "/payout-details",
  isAuthenticated,
  asyncHandler(async (request, response) => {
    const owner = await resolveProOwner(request);
    const data = await getPayoutDetails(owner, request.auth!.userId);
    response.status(200).json({ success: true, message: "Payout details retrieved.", data });
  }),
);

tradesafeRouter.put(
  "/payout-details",
  isAuthenticated,
  asyncHandler(async (request, response) => {
    const owner = await resolveProOwner(request);
    const updating = await hasPayoutDetails(owner);
    await savePayoutDetails(owner, parsePayoutDetails(request.body ?? {}, updating));
    const data = await getPayoutDetails(owner, request.auth!.userId);
    response.status(200).json({ success: true, message: "Payout details saved.", data });
  }),
);
