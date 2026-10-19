ALTER TABLE "users" ADD COLUMN "share_token" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "users_share_token_unique" ON "users" USING btree ("share_token");