CREATE TABLE "quest_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quest_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_xp_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quest_id" integer NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quest_options" ADD CONSTRAINT "quest_options_question_id_quest_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quest_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_questions" ADD CONSTRAINT "quest_questions_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_xp_awards" ADD CONSTRAINT "quest_xp_awards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_xp_awards" ADD CONSTRAINT "quest_xp_awards_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quest_options_question_id_index" ON "quest_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quest_questions_quest_id_index" ON "quest_questions" USING btree ("quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quest_xp_awards_user_quest_unique" ON "quest_xp_awards" USING btree ("user_id","quest_id");