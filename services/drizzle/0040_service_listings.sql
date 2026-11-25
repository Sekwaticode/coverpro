CREATE TABLE "service_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"client_id" text NOT NULL,
	"freelancer_id" text,
	"agency_id" uuid,
	"title" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"milestones" jsonb NOT NULL,
	"note" text,
	"preferred_start" date,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"decline_reason" text,
	"conversation_id" uuid,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_bookings_owner_check" CHECK (("service_bookings"."freelancer_id" IS NOT NULL) <> ("service_bookings"."agency_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "service_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"freelancer_id" text,
	"agency_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"milestones" jsonb NOT NULL,
	"delivery_days" integer NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_listings_price_check" CHECK ("service_listings"."price" > 0),
	CONSTRAINT "service_listings_owner_check" CHECK (("service_listings"."freelancer_id" IS NOT NULL) <> ("service_listings"."agency_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_listing_id_service_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_client_id_accounts_auth_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."accounts"("auth_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_freelancer_id_accounts_auth_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."accounts"("auth_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_agency_id_agency_metadata_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_freelancer_id_accounts_auth_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."accounts"("auth_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_agency_id_agency_metadata_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_bookings_client_idx" ON "service_bookings" USING btree ("client_id","status");--> statement-breakpoint
CREATE INDEX "service_bookings_freelancer_idx" ON "service_bookings" USING btree ("freelancer_id","status");--> statement-breakpoint
CREATE INDEX "service_bookings_agency_idx" ON "service_bookings" USING btree ("agency_id","status");--> statement-breakpoint
CREATE INDEX "service_listings_freelancer_idx" ON "service_listings" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "service_listings_agency_idx" ON "service_listings" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "service_listings_status_idx" ON "service_listings" USING btree ("status");