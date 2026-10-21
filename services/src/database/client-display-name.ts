import { sql } from "drizzle-orm";
import { client_metadata } from "./schema.js";

export const PRIVATE_CLIENT_NAME = "Private client";

/** Company name for business clients; individuals have none, so pros see a neutral label. */
export const clientDisplayName = sql<string>`coalesce(${client_metadata.company_name}, ${PRIVATE_CLIENT_NAME})`;
