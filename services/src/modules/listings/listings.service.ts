import { createClerkClient } from "@clerk/backend";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../database/client.js";
import {
  accounts,
  agency_metadata,
  freelancer_metadata,
  service_listings,
  type ListingMilestone,
} from "../../database/schema.js";
import { ApiError } from "../../utils/api-error.js";
import type { ListingOwner } from "./listings.owner.js";

export type ListingInput = {
  title: string;
  description: string;
  category: string;
  tags: string[];
  milestones: ListingMilestone[];
};

export type ListingRow = typeof service_listings.$inferSelect;

const ownerCondition = (owner: ListingOwner) =>
  "freelancerId" in owner
    ? eq(service_listings.freelancer_id, owner.freelancerId)
    : eq(service_listings.agency_id, owner.agencyId);

const fromRow = (row: ListingRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  tags: row.tags,
  price: Number(row.price),
  milestones: row.milestones,
  deliveryDays: row.delivery_days,
  status: row.status as "ACTIVE" | "PAUSED",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export type Listing = ReturnType<typeof fromRow>;

const totals = (milestones: ListingMilestone[]) => ({
  price: milestones.reduce((total: number, m: ListingMilestone) => total + m.amount, 0),
  deliveryDays: milestones.reduce((total: number, m: ListingMilestone) => total + m.days, 0),
});

export const getOwnListings = async (owner: ListingOwner): Promise<Listing[]> => {
  const rows: ListingRow[] = await db
    .select()
    .from(service_listings)
    .where(ownerCondition(owner))
    .orderBy(desc(service_listings.created_at));
  return rows.map(fromRow);
};

export const createListing = async (owner: ListingOwner, input: ListingInput) => {
  const { price, deliveryDays } = totals(input.milestones);
  const [row] = await db
    .insert(service_listings)
    .values({
      freelancer_id: "freelancerId" in owner ? owner.freelancerId : null,
      agency_id: "agencyId" in owner ? owner.agencyId : null,
      title: input.title,
      description: input.description,
      category: input.category,
      tags: input.tags,
      milestones: input.milestones,
      price: price.toFixed(2),
      delivery_days: deliveryDays,
    })
    .returning();
  return fromRow(row as ListingRow);
};

export const updateListing = async (
  owner: ListingOwner,
  id: string,
  input: ListingInput & { status?: "ACTIVE" | "PAUSED" },
) => {
  const { price, deliveryDays } = totals(input.milestones);
  const [row] = await db
    .update(service_listings)
    .set({
      title: input.title,
      description: input.description,
      category: input.category,
      tags: input.tags,
      milestones: input.milestones,
      price: price.toFixed(2),
      delivery_days: deliveryDays,
      ...(input.status ? { status: input.status } : {}),
      updated_at: new Date(),
    })
    .where(and(eq(service_listings.id, id), ownerCondition(owner)))
    .returning();
  if (!row) throw new ApiError(404, "Listing not found.");
  return fromRow(row as ListingRow);
};

export const setListingStatus = async (
  owner: ListingOwner,
  id: string,
  status: "ACTIVE" | "PAUSED",
) => {
  const [row] = await db
    .update(service_listings)
    .set({ status, updated_at: new Date() })
    .where(and(eq(service_listings.id, id), ownerCondition(owner)))
    .returning();
  if (!row) throw new ApiError(404, "Listing not found.");
  return fromRow(row as ListingRow);
};

export const deleteListing = async (owner: ListingOwner, id: string) => {
  // Bookings keep their own snapshot; their listing_id is set to null.
  const [row] = (await db
    .delete(service_listings)
    .where(and(eq(service_listings.id, id), ownerCondition(owner)))
    .returning({ id: service_listings.id })) as { id: string }[];
  if (!row) throw new ApiError(404, "Listing not found.");
};

export type PublicListingOwner = {
  type: "Freelancer" | "Agency";
  // freelancer_metadata.id or agency_metadata.id: the IDs used by profile pages.
  profileId: string;
  name: string;
  avatarUrl: string | null;
  verified: boolean;
};

const PUBLIC_PAGE_SIZE = 20;

/** Active listings for clients: all of them, one pro's, or one agency's. */
export const getPublicListings = async (filters: {
  query?: string;
  category?: string;
  freelancerProfileId?: string;
  agencyId?: string;
  offset?: number;
}) => {
  const conditions: SQL[] = [eq(service_listings.status, "ACTIVE")];
  if (filters.freelancerProfileId) {
    conditions.push(
      inArray(
        service_listings.freelancer_id,
        db
          .select({ authId: freelancer_metadata.auth_id })
          .from(freelancer_metadata)
          .where(eq(freelancer_metadata.id, filters.freelancerProfileId)),
      ),
    );
  }
  if (filters.agencyId) conditions.push(eq(service_listings.agency_id, filters.agencyId));
  if (filters.category) conditions.push(eq(service_listings.category, filters.category));
  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim().replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(service_listings.title, pattern),
        ilike(service_listings.description, pattern),
        ilike(service_listings.category, pattern),
        sql`array_to_string(${service_listings.tags}, ' ') ILIKE ${pattern}`,
      )!,
    );
  }

  const offset = filters.offset ?? 0;
  const rows: ListingRow[] = await db
    .select()
    .from(service_listings)
    .where(and(...conditions))
    .orderBy(desc(service_listings.created_at))
    .limit(PUBLIC_PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = rows.length > PUBLIC_PAGE_SIZE;
  const page = rows.slice(0, PUBLIC_PAGE_SIZE);
  const owners = await getListingOwners(page);

  return {
    listings: page.map((row) => ({
      ...fromRow(row),
      owner: owners.get(row.id) ?? null,
    })),
    hasMore,
  };
};

export const getPublicListing = async (id: string) => {
  const [row]: ListingRow[] = await db
    .select()
    .from(service_listings)
    .where(eq(service_listings.id, id))
    .limit(1);
  if (!row || row.status !== "ACTIVE") throw new ApiError(404, "Service not found.");
  const owners = await getListingOwners([row]);
  return { ...fromRow(row), owner: owners.get(row.id) ?? null };
};

/** Display info for each row's owner (pro or agency), keyed by row ID. */
export const getListingOwners = async (
  rows: Pick<ListingRow, "id" | "freelancer_id" | "agency_id">[],
) => {
  const result = new Map<string, PublicListingOwner>();
  const freelancerIds = [
    ...new Set(rows.map((row) => row.freelancer_id).filter((id): id is string => !!id)),
  ];
  const agencyIds = [
    ...new Set(rows.map((row) => row.agency_id).filter((id): id is string => !!id)),
  ];

  const freelancers: { authId: string; profileId: string; verified: boolean | null }[] =
    freelancerIds.length
      ? await db
          .select({
            authId: freelancer_metadata.auth_id,
            profileId: freelancer_metadata.id,
            verified: accounts.identityVerified,
          })
          .from(freelancer_metadata)
          .innerJoin(accounts, eq(accounts.auth_id, freelancer_metadata.auth_id))
          .where(inArray(freelancer_metadata.auth_id, freelancerIds))
      : [];

  const clerkUsers = new Map<string, { name: string; imageUrl: string | null }>();
  if (freelancerIds.length && env.clerkSecretKey) {
    try {
      const clerk = createClerkClient({ secretKey: env.clerkSecretKey });
      const { data } = await clerk.users.getUserList({
        userId: freelancerIds,
        limit: freelancerIds.length,
      });
      for (const user of data) {
        clerkUsers.set(user.id, {
          name: user.fullName || "Pro",
          imageUrl: user.imageUrl || null,
        });
      }
    } catch {
      // Names fall back to "Pro" below.
    }
  }

  const agencies: {
    id: string;
    name: string;
    avatar: { url: string } | null;
    verified: boolean | null;
  }[] = agencyIds.length
    ? await db
        .select({
          id: agency_metadata.id,
          name: agency_metadata.name,
          avatar: agency_metadata.avatar_image,
          verified: accounts.identityVerified,
        })
        .from(agency_metadata)
        .innerJoin(accounts, eq(accounts.auth_id, agency_metadata.owner_id))
        .where(inArray(agency_metadata.id, agencyIds))
    : [];

  for (const row of rows) {
    if (row.freelancer_id) {
      const freelancer = freelancers.find((item) => item.authId === row.freelancer_id);
      if (!freelancer) continue;
      const user = clerkUsers.get(row.freelancer_id);
      result.set(row.id, {
        type: "Freelancer",
        profileId: freelancer.profileId,
        name: user?.name ?? "Pro",
        avatarUrl: user?.imageUrl ?? null,
        verified: freelancer.verified === true,
      });
    } else if (row.agency_id) {
      const agency = agencies.find((item) => item.id === row.agency_id);
      if (!agency) continue;
      result.set(row.id, {
        type: "Agency",
        profileId: agency.id,
        name: agency.name,
        avatarUrl: agency.avatar?.url ?? null,
        verified: agency.verified === true,
      });
    }
  }
  return result;
};
