import { z } from "zod";
import { CompetencyIdSchema } from "../content/competency.schema.js";
import { AccomplishmentCountsSchema, ProfileSharingSchema } from "./sharing.schema.js";

export const InitialCompetencyBaselineSchema = z.object({
  assessmentId: z.number().int().positive(),
  assessmentVersion: z.string().min(1),
  completedAt: z.string(),
  skills: z.array(z.object({
    id: CompetencyIdSchema,
    assessed: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    score: z.number().int().min(0).max(100).nullable(),
  })),
});
export type InitialCompetencyBaseline = z.infer<typeof InitialCompetencyBaselineSchema>;

/** The Character a learner has chosen, as embedded in their profile. */
export const ProfileCharacterSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
});
export type ProfileCharacter = z.infer<typeof ProfileCharacterSchema>;

/** A single earned Badge, with its repeat count, as embedded in a profile. */
export const ProfileBadgeSchema = z.object({
  badgeDefinitionId: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().nullable(),
  count: z.number().int().positive(),
  latestAwardedAt: z.string(),
});
export type ProfileBadge = z.infer<typeof ProfileBadgeSchema>;

const QuestInteractionOutcomeSchema = z.object({
  status: z.enum(["submitted", "expired"]),
  passed: z.boolean(),
  score: z.number().int().min(0).max(100),
  xpAwarded: z.number().int().nonnegative(),
});
const ReadingInteractionOutcomeSchema = z.object({
  status: z.literal("completed"),
  assessed: z.literal(false),
  xpAwarded: z.number().int().nonnegative(),
});
export const ProfileActivitySchema = z.discriminatedUnion("activityType", [
  z.object({ id: z.string().uuid(), activityType: z.literal("quest"), activityId: z.number().int().positive(), occurredAt: z.string(), outcome: QuestInteractionOutcomeSchema }),
  z.object({ id: z.string().uuid(), activityType: z.literal("ctf"), activityId: z.number().int().positive(), occurredAt: z.string(), outcome: z.object({ status: z.enum(["solved", "wrong"]), xpAwarded: z.number().int().nonnegative() }) }),
  z.object({ id: z.string().uuid(), activityType: z.literal("reading"), activityId: z.number().int().positive(), occurredAt: z.string(), outcome: ReadingInteractionOutcomeSchema }),
]);
export type ProfileActivity = z.infer<typeof ProfileActivitySchema>;

/**
 * A learner's profile, as returned by `ProfilePresenter` in `apps/api`
 * (`GET /v1/api/users/profile`). `character` is `null` until the learner
 * completes onboarding by choosing one.
 */
export const ProfileResponseSchema = z.object({
  userId: z.string(),
  character: ProfileCharacterSchema.nullable(),
  totalXp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
  /** The approved learner-facing name for `level` (same formula). */
  adventurerRank: z.number().int().positive(),
  accomplishments: AccomplishmentCountsSchema,
  sharing: ProfileSharingSchema,
  badges: z.array(ProfileBadgeSchema),
  activity: z.array(ProfileActivitySchema),
  initialCompetencyBaseline: InitialCompetencyBaselineSchema.nullable(),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

/**
 * The approved public accomplishment summary (`GET /v1/api/shared-profiles/:shareId`).
 * Deliberately an allowlist: no user id, name, email, activity log, code, conversations or baseline.
 */
export const SharedProfileResponseSchema = z.object({
  adventurerRank: z.number().int().positive(),
  totalXp: z.number().int().nonnegative(),
  character: ProfileCharacterSchema.pick({ name: true, slug: true, imageUrl: true }).nullable(),
  badges: z.array(ProfileBadgeSchema.pick({ name: true, slug: true, imageUrl: true, count: true })),
  accomplishments: AccomplishmentCountsSchema,
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
});
export type SharedProfileResponse = z.infer<typeof SharedProfileResponseSchema>;
