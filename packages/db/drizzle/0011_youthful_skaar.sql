ALTER TABLE "quest_questions" ADD COLUMN "competency_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "quest_questions" ADD COLUMN "difficulty" text;--> statement-breakpoint
ALTER TABLE "stages" ADD COLUMN "competency_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "stages" ADD COLUMN "difficulty" text;--> statement-breakpoint
ALTER TABLE "quest_questions" ADD CONSTRAINT "quest_questions_difficulty_check" CHECK ("quest_questions"."difficulty" is null or "quest_questions"."difficulty" in ('beginner', 'intermediate', 'advanced'));--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_difficulty_check" CHECK ("stages"."difficulty" is null or "stages"."difficulty" in ('beginner', 'intermediate', 'advanced'));