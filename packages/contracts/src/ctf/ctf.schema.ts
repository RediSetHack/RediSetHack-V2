import { z } from "zod";

const DifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

/** One challenge in the catalog, `GET /v1/api/ctf/challenges`. Carries no artifact and no answer material. */
export const CtfChallengeSummarySchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  category: z.string(),
  difficulty: DifficultySchema,
  skills: z.array(z.string()),
  xpReward: z.number().int().nonnegative(),
  solved: z.boolean(),
});
export type CtfChallengeSummary = z.infer<typeof CtfChallengeSummarySchema>;

/** `GET /v1/api/ctf/challenges/:challengeId`: the summary plus the scope-bounding brief. */
export const CtfChallengeResponseSchema = CtfChallengeSummarySchema.extend({ brief: z.string() });
export type CtfChallengeResponse = z.infer<typeof CtfChallengeResponseSchema>;

export const CtfChallengeListResponseSchema = z.array(CtfChallengeSummarySchema);

/** `GET /v1/api/ctf/challenges/:challengeId/artifact`: the only door to the artifact content. */
export const CtfArtifactResponseSchema = z.object({ name: z.string(), content: z.string() });
export type CtfArtifactResponse = z.infer<typeof CtfArtifactResponseSchema>;

/** `POST /v1/api/ctf/challenges/:challengeId/attempts`. A replayed correct flag reports `alreadySolved` and pays nothing. */
export const CtfAttemptResponseSchema = z.object({
  correct: z.boolean(),
  alreadySolved: z.boolean(),
  xpAwarded: z.number().int().nonnegative(),
});
export type CtfAttemptResponse = z.infer<typeof CtfAttemptResponseSchema>;
