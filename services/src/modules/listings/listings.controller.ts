import { RequestHandler } from "express";
import type { ListingMilestone } from "../../database/schema.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { resolveProOwner } from "./listings.owner.js";
import {
  createListing,
  deleteListing,
  getOwnListings,
  getPublicListing,
  getPublicListings,
  setListingStatus,
  updateListing,
  type ListingInput,
} from "./listings.service.js";

const MAX_MILESTONES = 10;
const MAX_PRICE = 1_000_000;

const text = (value: unknown, name: string, min: number, max: number) => {
  const result = typeof value === "string" ? value.trim() : "";
  if (result.length < min) {
    throw new ApiError(400, min <= 1 ? `${name} is required.` : `${name} must be at least ${min} characters.`);
  }
  if (result.length > max) throw new ApiError(400, `${name} must be at most ${max} characters.`);
  return result;
};

const parseListing = (body: Record<string, unknown>): ListingInput => {
  const tags = Array.isArray(body.tags)
    ? [...new Set(body.tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 10)
    : [];

  if (!Array.isArray(body.milestones) || !body.milestones.length) {
    throw new ApiError(400, "Add at least one milestone.");
  }
  if (body.milestones.length > MAX_MILESTONES) {
    throw new ApiError(400, `A service can have at most ${MAX_MILESTONES} milestones.`);
  }
  const milestones: ListingMilestone[] = body.milestones.map((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const label = `Milestone ${index + 1}`;
    const amount = Math.round(Number(item.amount) * 100) / 100;
    const days = Math.round(Number(item.days));
    if (!Number.isFinite(amount) || amount < 1) {
      throw new ApiError(400, `${label}: amount must be at least R1.`);
    }
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      throw new ApiError(400, `${label}: days must be between 1 and 365.`);
    }
    return {
      title: text(item.title, `${label} title`, 1, 120),
      description: typeof item.description === "string" ? item.description.trim().slice(0, 1000) : "",
      amount,
      days,
    };
  });
  const price = milestones.reduce((total: number, m: ListingMilestone) => total + m.amount, 0);
  if (price > MAX_PRICE) throw new ApiError(400, "A service can be at most R1,000,000.");

  return {
    title: text(body.title, "Title", 5, 120),
    description: text(body.description, "Description", 30, 5000),
    category: text(body.category, "Category", 1, 60),
    tags,
    milestones,
  };
};

const parseStatus = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value !== "ACTIVE" && value !== "PAUSED") throw new ApiError(400, "Status is invalid.");
  return value;
};

const idParam = (value: unknown) => {
  if (typeof value !== "string" || !value) throw new ApiError(400, "Listing ID is required.");
  return value;
};

export const getMyListingsHandler: RequestHandler = asyncHandler(async (request, response) => {
  const listings = await getOwnListings(await resolveProOwner(request));
  response.status(200).json({ success: true, message: "Services retrieved.", data: listings });
});

export const createListingHandler: RequestHandler = asyncHandler(async (request, response) => {
  const owner = await resolveProOwner(request);
  const listing = await createListing(owner, parseListing(request.body ?? {}));
  response.status(201).json({ success: true, message: "Service published.", data: listing });
});

export const updateListingHandler: RequestHandler = asyncHandler(async (request, response) => {
  const owner = await resolveProOwner(request);
  const body = (request.body ?? {}) as Record<string, unknown>;
  const listing = await updateListing(owner, idParam(request.params.id), {
    ...parseListing(body),
    status: parseStatus(body.status),
  });
  response.status(200).json({ success: true, message: "Service updated.", data: listing });
});

export const setListingStatusHandler: RequestHandler = asyncHandler(async (request, response) => {
  const owner = await resolveProOwner(request);
  const status = parseStatus(request.body?.status);
  if (!status) throw new ApiError(400, "Status is required.");
  const listing = await setListingStatus(owner, idParam(request.params.id), status);
  response.status(200).json({ success: true, message: "Service updated.", data: listing });
});

export const deleteListingHandler: RequestHandler = asyncHandler(async (request, response) => {
  await deleteListing(await resolveProOwner(request), idParam(request.params.id));
  response.status(200).json({ success: true, message: "Service deleted.", data: null });
});

const queryText = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

export const getPublicListingsHandler: RequestHandler = asyncHandler(async (request, response) => {
  const offset = Number(request.query.offset ?? 0);
  const page = await getPublicListings({
    query: queryText(request.query.query),
    category: queryText(request.query.category),
    freelancerProfileId: queryText(request.query.freelancerId),
    agencyId: queryText(request.query.agencyId),
    offset: Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0,
  });
  response.status(200).json({ success: true, message: "Services retrieved.", data: page });
});

export const getPublicListingHandler: RequestHandler = asyncHandler(async (request, response) => {
  const listing = await getPublicListing(idParam(request.params.id));
  response.status(200).json({ success: true, message: "Service retrieved.", data: listing });
});
