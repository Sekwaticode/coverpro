import "dotenv/config";
import "../config/network.js";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "./client.js";

// Uses the app's own Neon client; drizzle-kit migrate exits silently when it cannot connect.
try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully.");
  process.exit(0);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
