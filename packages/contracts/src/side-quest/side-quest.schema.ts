import { z } from "zod";

/**
 * One prerequisite clause of a Side Quest (stored as data on the Side Quest).
 * `skill` clauses always deny until mastery estimates exist: an unknown
 * estimate never grants skill-gated access.
 */
export const SideQuestPrerequisiteSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("level"), minLevel: z.number().int().positive() }),
  z.object({ type: z.literal("badge"), badgeSlug: z.string().min(1) }),
  z.object({ type: z.literal("novel"), regionSlug: z.string().min(1) }),
  z.object({
    type: z.literal("activity"),
    activityType: z.enum(["quest", "coding", "ctf", "side_quest"]),
    activityId: z.number().int().positive(),
  }),
  z.object({ type: z.literal("skill"), skillId: z.string().min(1), minScore: z.number().min(0).max(100) }),
]);
export type SideQuestPrerequisite = z.infer<typeof SideQuestPrerequisiteSchema>;

/** Why access is denied, derived on the server from the learner's own state. */
export const SideQuestLockReasonSchema = z.object({
  type: z.enum(["level", "badge", "novel", "activity", "skill"]),
  message: z.string(),
});
export type SideQuestLockReason = z.infer<typeof SideQuestLockReasonSchema>;

export const SideQuestStatusSchema = z.enum(["locked", "available", "in_progress", "completed"]);

/** `GET /v1/api/side-quests`: optional objectives; locked ones are listed with their reasons. */
export const SideQuestSummarySchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  summary: z.string(),
  xpReward: z.number().int().nonnegative(),
  status: SideQuestStatusSchema,
  lockReasons: z.array(SideQuestLockReasonSchema),
});
export type SideQuestSummary = z.infer<typeof SideQuestSummarySchema>;
export const SideQuestListResponseSchema = z.array(SideQuestSummarySchema);

/** `GET /v1/api/side-quests/:id`. `brief` and `activity` are withheld (null) while locked. */
export const SideQuestResponseSchema = SideQuestSummarySchema.extend({
  requirements: z.array(z.object({ type: SideQuestLockReasonSchema.shape.type, message: z.string(), met: z.boolean() })),
  brief: z.string().nullable(),
  activity: z.object({ type: z.enum(["ctf", "coding"]), id: z.number().int().positive() }).nullable(),
});
export type SideQuestResponse = z.infer<typeof SideQuestResponseSchema>;

/** `POST /v1/api/side-quests/:id/start` (idempotent). */
export const SideQuestStartResponseSchema = z.object({ status: SideQuestStatusSchema, startedAt: z.string() });
export type SideQuestStartResponse = z.infer<typeof SideQuestStartResponseSchema>;

/** `POST /v1/api/side-quests/:id/submissions`. A replay reports `alreadyCompleted` and pays nothing. */
export const SideQuestSubmissionResponseSchema = z.object({
  passed: z.boolean(),
  completed: z.boolean(),
  alreadyCompleted: z.boolean(),
  xpAwarded: z.number().int().nonnegative(),
});
export type SideQuestSubmissionResponse = z.infer<typeof SideQuestSubmissionResponseSchema>;
