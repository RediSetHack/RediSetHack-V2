ALTER TABLE "contributor_draft_reviews" DROP CONSTRAINT "contributor_draft_reviews_reviewer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "contributor_draft_reviews" ALTER COLUMN "reviewer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contributor_draft_reviews" ADD CONSTRAINT "contributor_draft_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;