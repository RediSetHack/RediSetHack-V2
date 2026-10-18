import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./identity.js";

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
    storyIntro: text("story_intro"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
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
    archivedAt: timestamp("archived_at", { withTimezone: true }),
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
    // Structured lesson blocks, e.g. [{ type: "text", content: "..." }, { type: "code", ... }]
    lessonContent: jsonb("lesson_content"),
    competencyIds: jsonb("competency_ids").$type<string[]>().notNull().default([]),
    difficulty: text("difficulty"),
    xpReward: integer("xp_reward").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("stages_zone_slug_unique").on(table.zoneId, table.slug),
    index("stages_zone_id_index").on(table.zoneId),
    check("stages_difficulty_check", sql`${table.difficulty} is null or ${table.difficulty} in ('beginner', 'intermediate', 'advanced')`),
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
    initialAssessment: boolean("initial_assessment").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [index("quests_stage_id_index").on(table.stageId), uniqueIndex("quests_one_initial_assessment_unique").on(table.initialAssessment).where(sql`${table.initialAssessment} = true`)],
);

// A multiple-choice question belonging to a Quest.
export const questQuestions = pgTable(
  "quest_questions",
  {
    id: serial("id").primaryKey(),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    authoringId: text("authoring_id"),
    competencyIds: jsonb("competency_ids").$type<string[]>().notNull().default([]),
    difficulty: text("difficulty"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quest_questions_quest_id_index").on(table.questId),
    check("quest_questions_difficulty_check", sql`${table.difficulty} is null or ${table.difficulty} in ('beginner', 'intermediate', 'advanced')`),
  ],
);

// A selectable answer for a quest question; `isCorrect` is withheld from
// clients during an active session and revealed only in Result review.
export const questOptions = pgTable(
  "quest_options",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => questQuestions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    authoringId: text("authoring_id"),
    isCorrect: boolean("is_correct").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("quest_options_question_id_index").on(table.questionId)],
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
    questionsJson: jsonb("questions_json"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("results_user_id_index").on(table.userId),
    index("results_quest_id_index").on(table.questId),
  ],
);

export const initialCompetencyBaselines = pgTable("initial_competency_baselines", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  questId: integer("quest_id").notNull().references(() => quests.id),
  resultId: integer("result_id").notNull().unique().references(() => results.id),
  assessmentVersion: text("assessment_version").notNull(),
  skills: jsonb("skills").$type<Record<string, { assessed: number; correct: number; score: number }>>().notNull(),
  unassessedSkills: jsonb("unassessed_skills").$type<string[]>().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

// A Quest Session is the server-owned record of one timed attempt: who is
// playing, the question snapshot being assessed, and the server-set deadline.
// `status` leaves 'active' exactly once (the conditional UPDATE is the
// single-submission gate); 'submitted' and 'expired' sessions point at their
// Result. The partial unique index allows one resumable session per learner
// and Quest while still permitting any number of explicit retakes after it.
export const questSessions = pgTable(
  "quest_sessions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    questionsJson: jsonb("questions_json").notNull(),
    passingScore: integer("passing_score").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("active"),
    resultId: integer("result_id").references(() => results.id, { onDelete: "set null" }),
    xpAwarded: integer("xp_awarded").notNull().default(0),
  },
  (table) => [
    index("quest_sessions_user_quest_index").on(table.userId, table.questId),
    uniqueIndex("quest_sessions_one_active_unique")
      .on(table.userId, table.questId)
      .where(sql`${table.status} = 'active'`),
  ],
);

// One row per (user, quest) that has ever earned XP. The unique index is the
// enforcement point for "first pass only": awarding XP is a conditional
// insert into this table, so concurrent passing submissions can't both win.
export const questXpAwards = pgTable(
  "quest_xp_awards",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questId: integer("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("quest_xp_awards_user_quest_unique").on(table.userId, table.questId)],
);

// A graded coding exercise attached to a Stage. `authoringId` is the stable
// identity across edits; `visibleExamples` are shown to learners, while
// `hiddenChecks` are graded server-side and never leave the API. Each check
// runs the code with `input` on stdin and compares trimmed stdout to `expected`.
export const codingActivities = pgTable(
  "coding_activities",
  {
    id: serial("id").primaryKey(),
    stageId: integer("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "cascade" }),
    authoringId: text("authoring_id").notNull(),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    language: text("language").notNull().default("python"),
    starterCode: text("starter_code").notNull().default(""),
    competencyIds: jsonb("competency_ids").$type<string[]>().notNull().default([]),
    difficulty: text("difficulty"),
    // Programming and security learning objectives, shown with the activity.
    objectives: jsonb("objectives").$type<{ programming: string[]; security: string[] }>().notNull().default({ programming: [], security: [] }),
    // Where the reviewed content came from; copied onto each recorded interaction.
    provenance: jsonb("provenance").$type<Record<string, string> | null>(),
    visibleExamples: jsonb("visible_examples").$type<{ input: string; expected: string }[]>().notNull().default([]),
    hiddenChecks: jsonb("hidden_checks").$type<{ input: string; expected: string }[]>().notNull().default([]),
    // Completion rule: percentage of all (visible + hidden) checks that must pass.
    passingScore: integer("passing_score").notNull().default(100),
    xpReward: integer("xp_reward").notNull().default(0),
    contentVersion: text("content_version").notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("coding_activities_authoring_id_unique").on(table.authoringId),
    index("coding_activities_stage_id_index").on(table.stageId),
    check("coding_activities_difficulty_check", sql`${table.difficulty} is null or ${table.difficulty} in ('beginner', 'intermediate', 'advanced')`),
  ],
);

// A reviewed, artifact-based CTF challenge. `flagHash` (sha256 of the flag) is
// server-only and never leaves the API; `artifact` is served only through the
// stage-gated artifact endpoint, never the catalog. Challenges must not require
// attacking any external target: the artifact is the whole scope.
export const ctfChallenges = pgTable(
  "ctf_challenges",
  {
    id: serial("id").primaryKey(),
    stageId: integer("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "cascade" }),
    authoringId: text("authoring_id").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    difficulty: text("difficulty").notNull(),
    competencyIds: jsonb("competency_ids").$type<string[]>().notNull().default([]),
    brief: text("brief").notNull(),
    artifactName: text("artifact_name").notNull(),
    artifact: text("artifact").notNull(),
    flagHash: text("flag_hash").notNull(),
    xpReward: integer("xp_reward").notNull().default(0),
    contentVersion: text("content_version").notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ctf_challenges_authoring_id_unique").on(table.authoringId),
    index("ctf_challenges_stage_id_index").on(table.stageId),
    check("ctf_challenges_difficulty_check", sql`${table.difficulty} in ('beginner', 'intermediate', 'advanced')`),
  ],
);
