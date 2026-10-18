import { z } from "zod";

/** The languages the Codelab may execute under, mirroring the API's supported set. */
export const LanguageSchema = z.enum([
  "cpp",
  "c",
  "python",
  "javascript",
  "java",
]);
export type Language = z.infer<typeof LanguageSchema>;

/** One execution result, `POST /v1/api/codelab/execute`. */
export const ExecuteCodeResponseSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number().int(),
  executionTimeMs: z.number().int().nonnegative(),
  requestDurationMs: z.number().int().nonnegative(),
  failureType: z.enum(['none', 'compile', 'runtime', 'timeout']),
});
export type ExecuteCodeResponse = z.infer<typeof ExecuteCodeResponseSchema>;

const ObjectivesSchema = z.object({ programming: z.array(z.string()), security: z.array(z.string()) });
const ProvenanceSchema = z.record(z.string(), z.string()).nullable();

const CheckSchema = z.object({ input: z.string(), expected: z.string() });

/** Authoring shape of one graded coding activity; `hiddenChecks` never reach learners. */
export const CodingActivityAuthoringSchema = z.object({
  authoringId: z.string().min(1),
  stageId: z.number().int().positive(),
  title: z.string().min(1),
  prompt: z.string().min(1),
  language: LanguageSchema,
  starterCode: z.string(),
  competencyIds: z.array(z.string()),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
  objectives: ObjectivesSchema,
  provenance: ProvenanceSchema,
  visibleExamples: z.array(CheckSchema).min(1),
  hiddenChecks: z.array(CheckSchema).min(1),
  passingScore: z.number().int().min(1).max(100),
  xpReward: z.number().int().nonnegative(),
  contentVersion: z.string().min(1),
});
export type CodingActivityAuthoring = z.infer<typeof CodingActivityAuthoringSchema>;

/** A coding activity as a learner sees it, `GET /v1/api/codelab/activities/:activityId`. */
export const CodingActivityResponseSchema = z.object({
  id: z.number().int().positive(),
  stageId: z.number().int().positive(),
  title: z.string(),
  prompt: z.string(),
  language: LanguageSchema,
  starterCode: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
  objectives: ObjectivesSchema,
  provenance: ProvenanceSchema,
  visibleExamples: z.array(CheckSchema),
  passingScore: z.number().int(),
  xpReward: z.number().int().nonnegative(),
});
export type CodingActivityResponse = z.infer<typeof CodingActivityResponseSchema>;

export const CodingErrorCategorySchema = z.enum(["none", "wrong_answer", "compile", "runtime", "timeout"]);

/** One graded attempt, `POST .../activities/:id/attempts` and `GET .../attempts/:attemptId`. */
export const CodingAttemptResponseSchema = z.object({
  id: z.string().uuid(),
  activityId: z.number().int().positive(),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
  errorCategory: CodingErrorCategorySchema,
  checksPassed: z.number().int().nonnegative(),
  checksTotal: z.number().int().positive(),
  /** Per visible example only; hidden checks are reported as counts. */
  visibleResults: z.array(z.object({ input: z.string(), expected: z.string(), actual: z.string(), passed: z.boolean() })),
  /** Sandbox execution time summed across checks. */
  elapsedMs: z.number().int().nonnegative(),
  xpAwarded: z.number().int().nonnegative(),
  code: z.string(),
  submittedAt: z.string(),
});
export type CodingAttemptResponse = z.infer<typeof CodingAttemptResponseSchema>;
