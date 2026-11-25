ALTER TABLE "contracts" ALTER COLUMN "proposal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "job_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tradesafe_transactions" ALTER COLUMN "proposal_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "booking_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "conversation_id" uuid;--> statement-breakpoint
ALTER TABLE "tradesafe_transactions" ADD COLUMN "booking_id" uuid;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_booking_id_service_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."service_bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradesafe_transactions" ADD CONSTRAINT "tradesafe_transactions_booking_id_service_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."service_bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_booking_id_unique" UNIQUE("booking_id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_source_check" CHECK ("contracts"."proposal_id" IS NOT NULL OR "contracts"."booking_id" IS NOT NULL);--> statement-breakpoint
-- Backfill: existing (proposal-based) contracts use the chat opened for their proposal.
UPDATE "contracts" SET "conversation_id" = "conversations"."id" FROM "conversations" WHERE "conversations"."proposal_id" = "contracts"."proposal_id" AND "contracts"."conversation_id" IS NULL;
