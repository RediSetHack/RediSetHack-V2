import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Identity & progression
// ---------------------------------------------------------------------------

// Users are provisioned by Clerk; the `id` mirrors the Clerk user id so that
// JWT subjects map 1:1 to rows without a separate join.
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().notNull(),
    email: text("email").notNull(),
    name: text("name"),
    characterId: integer("character_id").references(() => characters.id, {
      onDelete: "set null",
    }),
    totalXp: integer("total_xp").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

// Characters are the avatar identities a user can select.
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Learning catalog: Region -> Zone -> Stage -> Quest
// ---------------------------------------------------------------------------

export const regions = pgTable(
  "regions",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("regions_slug_unique").on(table.slug)],
);

export const zones = pgTable(
  "zones",
  {
    id: serial("id").primaryKey(),
    regionId: integer("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("zones_region_slug_unique").on(table.regionId, table.slug),
    index("zones_region_id_index").on(table.regionId),
  ],
);

export const stages = pgTable(
  "stages",
  {
    id: serial("id").primaryKey(),
    zoneId: integer("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    lessonContent: text("lesson_content"),
    xpReward: integer("xp_reward").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("stages_zone_slug_unique").on(table.zoneId, table.slug),
    index("stages_zone_id_index").on(table.zoneId),
  ],
);

export const quests = pgTable(
  "quests",
  {
    id: serial("id").primaryKey(),
    stageId: integer("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    timeLimitSeconds: integer("time_limit_seconds").notNull().default(60),
    passingScore: integer("passing_score").notNull().default(70),
    xpReward: integer("xp_reward").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("quests_stage_id_index").on(table.stageId)],
);

// Results record the responses, score, and pass outcome of a quest submission.
export const results = pgTable(
  "results",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0),
    passed: boolean("passed").notNull().default(false),
    responsesJson: jsonb("responses_json"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("results_user_id_index").on(table.userId),
    index("results_quest_id_index").on(table.questId),
  ],
);

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

// ---------------------------------------------------------------------------
// Stage progression & daily events
// ---------------------------------------------------------------------------

// Tracks stage completion per user; stages unlock sequentially.
export const userProgress = pgTable(
  "user_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stageId: integer("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_progress_user_stage_unique").on(table.userId, table.stageId),
    index("user_progress_stage_id_index").on(table.stageId),
  ],
);

// One daily modifier per calendar day (Philippine Standard Time, UTC+8).
export const dailyEvents = pgTable(
  "daily_events",
  {
    id: serial("id").primaryKey(),
    eventDate: date("event_date").notNull(),
    // "normal" | "bonus"
    eventType: text("event_type", { enum: ["normal", "bonus"] }).notNull(),
    xpMultiplier: integer("xp_multiplier").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("daily_events_event_date_unique").on(table.eventDate)],
);