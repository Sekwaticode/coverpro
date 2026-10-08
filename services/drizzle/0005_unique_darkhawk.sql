-- The unique constraint moved into 0004 (its FK needs it); kept guarded for databases migrated before that fix.
DO $$ BEGIN
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_auth_id_unique" UNIQUE("auth_id");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;