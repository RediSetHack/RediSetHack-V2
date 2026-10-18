CREATE TABLE "ctf_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_id" integer NOT NULL,
	"authoring_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"competency_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"brief" text NOT NULL,
	"artifact_name" text NOT NULL,
	"artifact" text NOT NULL,
	"flag_hash" text NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"content_version" text DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "ctf_challenges_difficulty_check" CHECK ("ctf_challenges"."difficulty" in ('beginner', 'intermediate', 'advanced'))
);
--> statement-breakpoint
CREATE TABLE "ctf_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"challenge_id" integer NOT NULL,
	"correct" boolean NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctf_solves" (
	"id" serial PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"challenge_id" integer NOT NULL,
	"attempt_id" uuid NOT NULL,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"solved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ctf_challenges" ADD CONSTRAINT "ctf_challenges_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctf_attempts" ADD CONSTRAINT "ctf_attempts_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctf_attempts" ADD CONSTRAINT "ctf_attempts_challenge_id_ctf_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."ctf_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctf_solves" ADD CONSTRAINT "ctf_solves_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctf_solves" ADD CONSTRAINT "ctf_solves_challenge_id_ctf_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."ctf_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctf_solves" ADD CONSTRAINT "ctf_solves_attempt_id_ctf_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."ctf_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ctf_challenges_authoring_id_unique" ON "ctf_challenges" USING btree ("authoring_id");--> statement-breakpoint
CREATE INDEX "ctf_challenges_stage_id_index" ON "ctf_challenges" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "ctf_attempts_learner_challenge_index" ON "ctf_attempts" USING btree ("learner_id","challenge_id","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ctf_solves_learner_challenge_unique" ON "ctf_solves" USING btree ("learner_id","challenge_id");