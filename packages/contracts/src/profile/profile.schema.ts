import { z } from "zod";

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
  badges: z.array(ProfileBadgeSchema),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
