ALTER TABLE "client_metadata" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_metadata" ALTER COLUMN "company_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_metadata" ALTER COLUMN "company_website" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_metadata" ALTER COLUMN "company_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_metadata" ALTER COLUMN "industry" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_metadata" ALTER COLUMN "company_description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "client_metadata" ADD COLUMN "client_type" text DEFAULT 'BUSINESS' NOT NULL;--> statement-breakpoint
ALTER TABLE "client_metadata" ADD CONSTRAINT "client_metadata_client_type_check" CHECK ("client_metadata"."client_type" IN ('INDIVIDUAL', 'BUSINESS'));