import { z } from "zod";

export const QuestQuestionAuthoringSchema = z
  .object({
    id: z.string().refine((value) => value.trim().length > 0),
    prompt: z.string().refine((value) => value.trim().length > 0),
    options: z
      .array(
        z.object({
          id: z.string().refine((value) => value.trim().length > 0),
          text: z.string().refine((value) => value.trim().length > 0),
        }),
      )
      .min(2),
    correctOptionId: z.string().refine((value) => value.trim().length > 0),
  })
  .refine(
    (question) =>
      new Set(question.options.map(({ id }) => id)).size ===
        question.options.length &&
      question.options.some(({ id }) => id === question.correctOptionId),
  );

export const QuestAuthoringQuestionsSchema = z
  .array(QuestQuestionAuthoringSchema)
  .min(1)
  .refine(
    (questions) =>
      new Set(questions.map(({ id }) => id)).size === questions.length,
  );

export type QuestQuestionAuthoring = z.infer<
  typeof QuestQuestionAuthoringSchema
>;
