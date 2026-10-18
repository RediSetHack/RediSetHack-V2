CREATE TABLE "coding_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_id" integer NOT NULL,
	"authoring_id" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"language" text DEFAULT 'python' NOT NULL,
	"starter_code" text DEFAULT '' NOT NULL,
	"competency_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text,
	"visible_examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hidden_checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"passing_score" integer DEFAULT 100 NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"content_version" text DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "coding_activities_difficulty_check" CHECK ("coding_activities"."difficulty" is null or "coding_activities"."difficulty" in ('beginner', 'intermediate', 'advanced'))
);
--> statement-breakpoint
CREATE TABLE "coding_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"code" text NOT NULL,
	"score" integer NOT NULL,
	"passed" boolean NOT NULL,
	"error_category" text NOT NULL,
	"checks_passed" integer NOT NULL,
	"checks_total" integer NOT NULL,
	"visible_results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"elapsed_ms" integer NOT NULL,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coding_xp_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"attempt_id" uuid NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coding_activities" ADD CONSTRAINT "coding_activities_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_attempts" ADD CONSTRAINT "coding_attempts_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_attempts" ADD CONSTRAINT "coding_attempts_activity_id_coding_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."coding_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_xp_awards" ADD CONSTRAINT "coding_xp_awards_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_xp_awards" ADD CONSTRAINT "coding_xp_awards_activity_id_coding_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."coding_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_xp_awards" ADD CONSTRAINT "coding_xp_awards_attempt_id_coding_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."coding_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coding_activities_authoring_id_unique" ON "coding_activities" USING btree ("authoring_id");--> statement-breakpoint
CREATE INDEX "coding_activities_stage_id_index" ON "coding_activities" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "coding_attempts_learner_activity_index" ON "coding_attempts" USING btree ("learner_id","activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coding_xp_awards_learner_activity_unique" ON "coding_xp_awards" USING btree ("learner_id","activity_id");