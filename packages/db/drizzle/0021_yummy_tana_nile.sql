CREATE TABLE "contributor_draft_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_id" integer NOT NULL,
	"revision" integer NOT NULL,
	"title" text NOT NULL,
	"lesson_content" jsonb NOT NULL,
	"decision" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"reason" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_stage_id" integer,
	CONSTRAINT "contributor_draft_reviews_decision_check" CHECK ("contributor_draft_reviews"."decision" in ('approved', 'rejected', 'revision-needed', 'unpublished'))
);
--> statement-breakpoint
ALTER TABLE "contributor_drafts" DROP CONSTRAINT "contributor_drafts_state_check";--> statement-breakpoint
ALTER TABLE "contributor_draft_reviews" ADD CONSTRAINT "contributor_draft_reviews_draft_id_contributor_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."contributor_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributor_draft_reviews" ADD CONSTRAINT "contributor_draft_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributor_draft_reviews" ADD CONSTRAINT "contributor_draft_reviews_published_stage_id_stages_id_fk" FOREIGN KEY ("published_stage_id") REFERENCES "public"."stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contributor_draft_reviews_draft_id_index" ON "contributor_draft_reviews" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "contributor_draft_reviews_decision_index" ON "contributor_draft_reviews" USING btree ("decision");--> statement-breakpoint
ALTER TABLE "contributor_drafts" ADD CONSTRAINT "contributor_drafts_state_check" CHECK (("contributor_drafts"."status" in ('draft', 'revision-needed') and "contributor_drafts"."submitted_revision" is null and "contributor_drafts"."submitted_at" is null) or ("contributor_drafts"."status" in ('submitted', 'approved', 'rejected') and "contributor_drafts"."submitted_revision" = "contributor_drafts"."revision" and "contributor_drafts"."submitted_at" is not null));