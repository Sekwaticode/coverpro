import { RequestHandler } from "express";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireClientAuth, resolveProOwner } from "../listings/listings.owner.js";
import {
  acceptBooking,
  cancelBooking,
  createBookingCheckout,
  declineBooking,
  getClientBookings,
  getReceivedBookings,
  requestBooking,
} from "./bookings.service.js";

const idParam = (value: unknown) => {
  if (typeof value !== "string" || !value) throw new ApiError(400, "Booking ID is required.");
  return value;
};

const optionalText = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

const parseStartDate = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, "Preferred start date is invalid.");
  }
  const today = new Date().toISOString().slice(0, 10);
  if (value < today) throw new ApiError(400, "Preferred start date can't be in the past.");
  return value;
};

export const requestBookingHandler: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireClientAuth(request);
  const body = (request.body ?? {}) as Record<string, unknown>;
  if (typeof body.listingId !== "string" || !body.listingId) {
    throw new ApiError(400, "Choose a service.");
  }
  const booking = await requestBooking(auth.userId, {
    listingId: body.listingId,
    note: optionalText(body.note, 2000),
    preferredStart: parseStartDate(body.preferredStart),
  });
  response.status(201).json({ success: true, message: "Request sent.", data: booking });
});

export const getClientBookingsHandler: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireClientAuth(request);
  const bookings = await getClientBookings(auth.userId);
  response.status(200).json({ success: true, message: "Bookings retrieved.", data: bookings });
});

export const cancelBookingHandler: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireClientAuth(request);
  const booking = await cancelBooking(auth.userId, idParam(request.params.id));
  response.status(200).json({ success: true, message: "Request cancelled.", data: booking });
});

export const getReceivedBookingsHandler: RequestHandler = asyncHandler(
  async (request, response) => {
    const bookings = await getReceivedBookings(await resolveProOwner(request));
    response.status(200).json({ success: true, message: "Bookings retrieved.", data: bookings });
  },
);

export const acceptBookingHandler: RequestHandler = asyncHandler(async (request, response) => {
  const owner = await resolveProOwner(request);
  const booking = await acceptBooking(owner, request.auth!.userId, idParam(request.params.id));
  response.status(200).json({ success: true, message: "Request accepted.", data: booking });
});

export const declineBookingHandler: RequestHandler = asyncHandler(async (request, response) => {
  const owner = await resolveProOwner(request);
  const booking = await declineBooking(
    owner,
    idParam(request.params.id),
    optionalText(request.body?.reason, 500),
  );
  response.status(200).json({ success: true, message: "Request declined.", data: booking });
});

export const bookingCheckoutHandler: RequestHandler = asyncHandler(async (request, response) => {
  const auth = requireClientAuth(request);
  const url = await createBookingCheckout(auth.userId, idParam(request.params.id));
  response.status(200).json({ success: true, message: "Checkout created.", data: { url } });
});
