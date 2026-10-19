CREATE TABLE "contributor_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"zone_id" integer NOT NULL,
	"title" text NOT NULL,
	"lesson_content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"submitted_revision" integer,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contributor_drafts_state_check" CHECK (("contributor_drafts"."status" = 'draft' and "contributor_drafts"."submitted_revision" is null and "contributor_drafts"."submitted_at" is null) or ("contributor_drafts"."status" = 'submitted' and "contributor_drafts"."submitted_revision" = "contributor_drafts"."revision" and "contributor_drafts"."submitted_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "contributor_drafts" ADD CONSTRAINT "contributor_drafts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributor_drafts" ADD CONSTRAINT "contributor_drafts_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contributor_drafts_owner_id_index" ON "contributor_drafts" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "contributor_drafts_zone_id_index" ON "contributor_drafts" USING btree ("zone_id");