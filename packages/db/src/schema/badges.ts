import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./identity.js";

// ---------------------------------------------------------------------------
// Badges (GitHub-style multiplicity; criteria are data, not code)
// ---------------------------------------------------------------------------

export const badgeDefinitions = pgTable(
  "badge_definitions",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    // Data-driven criteria per ADR 0003, e.g.
    // { trigger: "cumulative", target: "stage_completions", threshold: 5 }
    criteriaJson: jsonb("criteria_json").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("badge_definitions_slug_unique").on(table.slug)],
);

// Each row is one distinct award milestone, enabling repeat badges (e.g. x3).
export const badgeAwards = pgTable(
  "badge_awards",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeDefinitionId: integer("badge_definition_id")
      .notNull()
      .references(() => badgeDefinitions.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("badge_awards_user_id_index").on(table.userId),
    index("badge_awards_badge_definition_id_index").on(table.badgeDefinitionId),
  ],
);
