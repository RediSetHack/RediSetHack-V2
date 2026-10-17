CREATE TABLE "quest_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quest_id" integer NOT NULL,
	"questions_json" jsonb NOT NULL,
	"passing_score" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"result_id" integer,
	"xp_awarded" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quest_sessions" ADD CONSTRAINT "quest_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_sessions" ADD CONSTRAINT "quest_sessions_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_sessions" ADD CONSTRAINT "quest_sessions_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quest_sessions_user_quest_index" ON "quest_sessions" USING btree ("user_id","quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quest_sessions_one_active_unique" ON "quest_sessions" USING btree ("user_id","quest_id") WHERE "quest_sessions"."status" = 'active';