ALTER TABLE "badge_awards" ADD COLUMN "milestone" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, badge_definition_id ORDER BY awarded_at ASC, id ASC) AS rn
  FROM badge_awards
)
UPDATE badge_awards
SET milestone = ranked.rn
FROM ranked
WHERE badge_awards.id = ranked.id;--> statement-breakpoint
CREATE UNIQUE INDEX "badge_awards_user_id_badge_definition_id_milestone_unique" ON "badge_awards" USING btree ("user_id","badge_definition_id","milestone");
