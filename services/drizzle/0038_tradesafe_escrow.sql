CREATE TABLE "tradesafe_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" text NOT NULL,
	"proposal_id" uuid NOT NULL,
	"client_id" text NOT NULL,
	"contract_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"allocation_ids" jsonb NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tradesafe_transactions_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "tradesafe_token_id" text;--> statement-breakpoint
ALTER TABLE "contract_milestones" ADD COLUMN "tradesafe_allocation_id" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "tradesafe_transaction_id" text;--> statement-breakpoint
ALTER TABLE "tradesafe_transactions" ADD CONSTRAINT "tradesafe_transactions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradesafe_transactions" ADD CONSTRAINT "tradesafe_transactions_client_id_accounts_auth_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."accounts"("auth_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradesafe_transactions" ADD CONSTRAINT "tradesafe_transactions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_tradesafe_token_id_unique" UNIQUE("tradesafe_token_id");--> statement-breakpoint
ALTER TABLE "contract_milestones" ADD CONSTRAINT "contract_milestones_tradesafe_allocation_id_unique" UNIQUE("tradesafe_allocation_id");--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tradesafe_transaction_id_unique" UNIQUE("tradesafe_transaction_id");