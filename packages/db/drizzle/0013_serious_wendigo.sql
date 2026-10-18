ALTER TABLE "learning_interactions" ALTER COLUMN "session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_interactions" ALTER COLUMN "started_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "learning_interactions" ALTER COLUMN "elapsed_ms" DROP NOT NULL;