import { z } from "zod";

/** A prose block, rendered as readable text. */
export const TextBlockSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
});
export type TextBlock = z.infer<typeof TextBlockSchema>;

/** A syntax-highlighted code sample in the language it declares. */
export const CodeBlockSchema = z.object({
  type: z.literal("code"),
  language: z.string(),
  content: z.string(),
});
export type CodeBlock = z.infer<typeof CodeBlockSchema>;

/** A practice prompt with starter code the learner can open in the Codelab. */
export const ExerciseBlockSchema = z.object({
  type: z.literal("exercise"),
  prompt: z.string(),
  language: z.string(),
  starterCode: z.string(),
});
export type ExerciseBlock = z.infer<typeof ExerciseBlockSchema>;

/**
 * Any block whose `type` isn't one the renderer knows yet. Kept permissive
 * (rather than a discriminated union of only the three known types) so a
 * future block type still parses — the *rendering* degrades legibly, the
 * *contract* doesn't throw on it.
 */
export const UnknownBlockSchema = z.object({ type: z.string() }).passthrough();

export const LessonBlockSchema = z.union([
  TextBlockSchema,
  CodeBlockSchema,
  ExerciseBlockSchema,
  UnknownBlockSchema,
]);
export type LessonBlock = z.infer<typeof LessonBlockSchema>;

/** A Stage's Lesson, as returned by `LessonPresenter` — `GET /v1/api/stages/:stageId/lesson`. */
export const LessonResponseSchema = z.object({
  id: z.number().int().positive(),
  zoneId: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  xpReward: z.number().int().nonnegative(),
  sortOrder: z.number().int(),
  status: z.enum(["available", "completed"]),
  blocks: z.array(LessonBlockSchema),
});
export type LessonResponse = z.infer<typeof LessonResponseSchema>;
