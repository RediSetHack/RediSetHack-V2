import { sql } from "drizzle-orm";
import { boolean, date, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity.js";
import { codingActivities, ctfChallenges, stages } from "./catalog.js";

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

// One immutable research/profile event per accepted Quest result or reading completion.
export const learningInteractions = pgTable(
  "learning_interactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    activityType: text("activity_type", { enum: ["quest", "reading", "coding", "ctf", "side_quest"] }).notNull(),
    activityId: integer("activity_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    elapsedMs: integer("elapsed_ms"),
    elapsedDefinition: text("elapsed_definition").notNull(),
    contentVersion: text("content_version").notNull(),
    skills: jsonb("skills").$type<string[]>().notNull().default([]),
    difficulty: text("difficulty"),
    answers: jsonb("answers"),
    correctness: boolean("correctness"),
    outcome: jsonb("outcome").notNull(),
    errors: jsonb("errors"),
    hints: jsonb("hints"),
  },
  (table) => [
    uniqueIndex("learning_interactions_session_unique").on(table.sessionId),
    index("learning_interactions_learner_occurred_index").on(table.learnerId, table.occurredAt),
  ],
);

export const readingSessions = pgTable(
  "reading_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    stageId: integer("stage_id").notNull().references(() => stages.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("reading_sessions_active_unique").on(table.learnerId, table.stageId).where(sql`${table.completedAt} is null`),
  ],
);

// One graded submission of a coding activity. `code` is retained so the learner
// can review their own attempt and for research under the project's learner-data
// policy; it is only ever returned to its owner. `elapsedMs` is summed sandbox
// execution time across checks (excludes network latency and learner think time).
export const codingAttempts = pgTable(
  "coding_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    activityId: integer("activity_id").notNull().references(() => codingActivities.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    // none | wrong_answer | compile | runtime | timeout
    errorCategory: text("error_category").notNull(),
    checksPassed: integer("checks_passed").notNull(),
    checksTotal: integer("checks_total").notNull(),
    // Per visible example output only; hidden checks are never stored per-check.
    visibleResults: jsonb("visible_results").$type<{ input: string; expected: string; actual: string; passed: boolean }[]>().notNull().default([]),
    elapsedMs: integer("elapsed_ms").notNull(),
    xpAwarded: integer("xp_awarded").notNull().default(0),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("coding_attempts_learner_activity_index").on(table.learnerId, table.activityId)],
);

// "First pass only" gate: the unique index makes XP for a coding activity
// idempotent even under concurrent or repeated passing submissions.
export const codingXpAwards = pgTable(
  "coding_xp_awards",
  {
    id: serial("id").primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    activityId: integer("activity_id").notNull().references(() => codingActivities.id, { onDelete: "cascade" }),
    attemptId: uuid("attempt_id").notNull().references(() => codingAttempts.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("coding_xp_awards_learner_activity_unique").on(table.learnerId, table.activityId)],
);

// One submitted flag. Only the verdict is kept, never the submitted text, so
// attempts cannot become a side channel for answer material.
export const ctfAttempts = pgTable(
  "ctf_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    challengeId: integer("challenge_id").notNull().references(() => ctfChallenges.id, { onDelete: "cascade" }),
    correct: boolean("correct").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ctf_attempts_learner_challenge_index").on(table.learnerId, table.challengeId, table.submittedAt)],
);

// The unique index is the exactly-once gate for the completion, its XP and its event.
export const ctfSolves = pgTable(
  "ctf_solves",
  {
    id: serial("id").primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    challengeId: integer("challenge_id").notNull().references(() => ctfChallenges.id, { onDelete: "cascade" }),
    attemptId: uuid("attempt_id").notNull().references(() => ctfAttempts.id, { onDelete: "cascade" }),
    xpAwarded: integer("xp_awarded").notNull().default(0),
    solvedAt: timestamp("solved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("ctf_solves_learner_challenge_unique").on(table.learnerId, table.challengeId)],
);

// An optional learning objective that designates an existing assessed activity
// (a CTF challenge or coding activity) as its task. `prerequisites` is a data-
// driven list of clauses (see @repo/contracts); it gates visibility of the
// objective's body, start, submit and completion.
export const sideQuests = pgTable(
  "side_quests",
  {
    id: serial("id").primaryKey(),
    authoringId: text("authoring_id").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    brief: text("brief").notNull(),
    // Polymorphic reference (no FK): "ctf" -> ctf_challenges.id, "coding" -> coding_activities.id.
    activityType: text("activity_type", { enum: ["ctf", "coding"] }).notNull(),
    activityId: integer("activity_id").notNull(),
    prerequisites: jsonb("prerequisites").$type<Record<string, unknown>[]>().notNull().default([]),
    xpReward: integer("xp_reward").notNull().default(0),
    contentVersion: text("content_version").notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("side_quests_authoring_id_unique").on(table.authoringId)],
);

export const sideQuestStarts = pgTable(
  "side_quest_starts",
  {
    id: serial("id").primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sideQuestId: integer("side_quest_id").notNull().references(() => sideQuests.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("side_quest_starts_learner_quest_unique").on(table.learnerId, table.sideQuestId)],
);

// One Side Quest accomplishment per learner. The unique index is the exactly-once
// gate for the completion, its XP and its learning-interaction event (`eventId`).
export const sideQuestCompletions = pgTable(
  "side_quest_completions",
  {
    id: serial("id").primaryKey(),
    learnerId: text("learner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sideQuestId: integer("side_quest_id").notNull().references(() => sideQuests.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => learningInteractions.id, { onDelete: "set null" }),
    xpAwarded: integer("xp_awarded").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("side_quest_completions_learner_quest_unique").on(table.learnerId, table.sideQuestId)],
);
