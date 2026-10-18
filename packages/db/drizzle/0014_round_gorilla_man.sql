CREATE TABLE "initial_competency_baselines" (
	"user_id" text PRIMARY KEY NOT NULL,
	"quest_id" integer NOT NULL,
	"result_id" integer NOT NULL,
	"assessment_version" text NOT NULL,
	"skills" jsonb NOT NULL,
	"unassessed_skills" jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "initial_competency_baselines_result_id_unique" UNIQUE("result_id")
);
--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "initial_assessment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "initial_competency_baselines" ADD CONSTRAINT "initial_competency_baselines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initial_competency_baselines" ADD CONSTRAINT "initial_competency_baselines_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initial_competency_baselines" ADD CONSTRAINT "initial_competency_baselines_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "quests_one_initial_assessment_unique" ON "quests" USING btree ("initial_assessment") WHERE "quests"."initial_assessment" = true;