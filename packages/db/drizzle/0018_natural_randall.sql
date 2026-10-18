CREATE TABLE "side_quest_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"side_quest_id" integer NOT NULL,
	"event_id" uuid,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "side_quest_starts" (
	"id" serial PRIMARY KEY NOT NULL,
	"learner_id" text NOT NULL,
	"side_quest_id" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "side_quests" (
	"id" serial PRIMARY KEY NOT NULL,
	"authoring_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"brief" text NOT NULL,
	"activity_type" text NOT NULL,
	"activity_id" integer NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"content_version" text DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "side_quest_completions" ADD CONSTRAINT "side_quest_completions_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "side_quest_completions" ADD CONSTRAINT "side_quest_completions_side_quest_id_side_quests_id_fk" FOREIGN KEY ("side_quest_id") REFERENCES "public"."side_quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "side_quest_completions" ADD CONSTRAINT "side_quest_completions_event_id_learning_interactions_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."learning_interactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "side_quest_starts" ADD CONSTRAINT "side_quest_starts_learner_id_users_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "side_quest_starts" ADD CONSTRAINT "side_quest_starts_side_quest_id_side_quests_id_fk" FOREIGN KEY ("side_quest_id") REFERENCES "public"."side_quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "side_quest_completions_learner_quest_unique" ON "side_quest_completions" USING btree ("learner_id","side_quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "side_quest_starts_learner_quest_unique" ON "side_quest_starts" USING btree ("learner_id","side_quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "side_quests_authoring_id_unique" ON "side_quests" USING btree ("authoring_id");