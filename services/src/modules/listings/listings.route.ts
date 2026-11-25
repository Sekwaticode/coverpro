import { Router } from "express";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import {
  createListingHandler,
  deleteListingHandler,
  getMyListingsHandler,
  getPublicListingHandler,
  getPublicListingsHandler,
  setListingStatusHandler,
  updateListingHandler,
} from "./listings.controller.js";

export const listingRouter = Router();

// Public: browse active services (filters: query, category, freelancerId, agencyId, offset).
listingRouter.get("/public", getPublicListingsHandler);
listingRouter.get("/public/:id", getPublicListingHandler);

// Pro / agency (agency dashboard adds ?scope=agency).
listingRouter.get("/mine", isAuthenticated, getMyListingsHandler);
listingRouter.post("/", isAuthenticated, createListingHandler);
listingRouter.put("/:id", isAuthenticated, updateListingHandler);
listingRouter.patch("/:id/status", isAuthenticated, setListingStatusHandler);
listingRouter.delete("/:id", isAuthenticated, deleteListingHandler);
