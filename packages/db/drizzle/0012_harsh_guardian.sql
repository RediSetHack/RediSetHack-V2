CREATE TABLE "learning_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"session_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"activity_id" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"elapsed_ms" integer NOT NULL,
	"elapsed_definition" text NOT NULL,
	"content_version" text NOT NULL,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text,
	"answers" jsonb,
	"correctness" boolean,
	"outcome" jsonb NOT NULL,
	"errors" jsonb,
	"hints" jsonb
);
--> statement-breakpoint
CREATE TABLE "reading_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"stage_id" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "learning_interactions" ADD CONSTRAINT "learning_interactions_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_interactions_session_unique" ON "learning_interactions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "learning_interactions_learner_occurred_index" ON "learning_interactions" USING btree ("learner_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reading_sessions_active_unique" ON "reading_sessions" USING btree ("learner_id","stage_id") WHERE "reading_sessions"."completed_at" is null;