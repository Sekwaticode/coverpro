import type { Request } from "express";
import { ApiError } from "../../utils/api-error.js";
import { getAgencyIdForMember } from "../agency/agency.service.js";

/** Who a listing or booking belongs to: an individual pro, or an agency. */
export type ListingOwner = { freelancerId: string } | { agencyId: string };

/**
 * Resolves the pro-side owner for the signed-in freelancer. The agency dashboard
 * passes `scope=agency` to act for the agency the user belongs to.
 */
export const resolveProOwner = async (request: Request): Promise<ListingOwner> => {
  if (!request.auth) throw new ApiError(401, "Authentication is required.");
  if (request.auth.role !== "freelancer") {
    throw new ApiError(403, "A pro account is required.");
  }
  if (request.query.scope === "agency") {
    const agencyId = await getAgencyIdForMember(request.auth.userId);
    if (!agencyId) {
      throw new ApiError(404, "No agency workspace was found for this account.");
    }
    return { agencyId };
  }
  return { freelancerId: request.auth.userId };
};

export const requireClientAuth = (request: Request) => {
  if (!request.auth) throw new ApiError(401, "Authentication is required.");
  if (request.auth.role !== "client") {
    throw new ApiError(403, "A client account is required.");
  }
  return request.auth;
};
