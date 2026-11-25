CREATE TABLE "job_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"client_id" text NOT NULL,
	"freelancer_id" text,
	"agency_id" uuid,
	"message" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "job_invitations_target_check" CHECK (("job_invitations"."freelancer_id" IS NOT NULL) <> ("job_invitations"."agency_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_job_id_job_posts_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_client_id_accounts_auth_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."accounts"("auth_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_freelancer_id_accounts_auth_id_fk" FOREIGN KEY ("freelancer_id") REFERENCES "public"."accounts"("auth_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_agency_id_agency_metadata_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agency_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "job_invitation_freelancer_unique" ON "job_invitations" USING btree ("job_id","freelancer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_invitation_agency_unique" ON "job_invitations" USING btree ("job_id","agency_id");--> statement-breakpoint
CREATE INDEX "job_invitation_freelancer_idx" ON "job_invitations" USING btree ("freelancer_id");--> statement-breakpoint
CREATE INDEX "job_invitation_agency_idx" ON "job_invitations" USING btree ("agency_id");