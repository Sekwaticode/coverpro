import { Router } from "express";
import { isAuthenticated } from "../../middleware/auth.middleware.js";
import {
  acceptBookingHandler,
  bookingCheckoutHandler,
  cancelBookingHandler,
  declineBookingHandler,
  getClientBookingsHandler,
  getReceivedBookingsHandler,
  requestBookingHandler,
} from "./bookings.controller.js";

export const bookingRouter = Router();

// Client
bookingRouter.post("/", isAuthenticated, requestBookingHandler);
bookingRouter.get("/", isAuthenticated, getClientBookingsHandler);
bookingRouter.post("/:id/cancel", isAuthenticated, cancelBookingHandler);
bookingRouter.post("/:id/checkout", isAuthenticated, bookingCheckoutHandler);

// Pro / agency (agency dashboard adds ?scope=agency)
bookingRouter.get("/received", isAuthenticated, getReceivedBookingsHandler);
bookingRouter.post("/:id/accept", isAuthenticated, acceptBookingHandler);
bookingRouter.post("/:id/decline", isAuthenticated, declineBookingHandler);
