import { z } from "zod";
import { CodeBlockSchema, ExerciseBlockSchema, ImageBlockSchema, TextBlockSchema } from "../progress/lesson.schema.js";

/**
 * Contributors may only author block types the learner renderer knows; the
 * permissive `UnknownBlockSchema` is for reading, not writing. Drafts therefore
 * stay compatible with the Lesson contract they will later be promoted into.
 */
export const AuthoredLessonBlockSchema = z.union([
  TextBlockSchema.extend({ content: z.string().trim().min(1, "Text blocks need content") }),
  CodeBlockSchema.extend({ language: z.string().trim().min(1, "Code blocks need a language") }),
  ImageBlockSchema.extend({ alt: z.string().trim().min(1, "Images need alternative text") }),
  ExerciseBlockSchema.extend({ prompt: z.string().trim().min(1, "Exercises need a prompt") }),
]);

const DraftBodyShape = {
  title: z.string().trim().min(1, "Title is required").max(120, "Title is at most 120 characters"),
  lessonContent: z.array(AuthoredLessonBlockSchema).max(100, "A Lesson has at most 100 blocks"),
};

/** `POST /v1/api/contributor/drafts`: a draft Lesson for a Stage-to-be inside an existing Zone (chapter). */
export const CreateContributorDraftSchema = z.object({ zoneId: z.number().int().positive(), ...DraftBodyShape });
export type CreateContributorDraft = z.infer<typeof CreateContributorDraftSchema>;

/** `PUT /v1/api/contributor/drafts/:id`: `revision` is the revision the edit was made against. */
export const UpdateContributorDraftSchema = z.object({ revision: z.number().int().positive(), ...DraftBodyShape });
export type UpdateContributorDraft = z.infer<typeof UpdateContributorDraftSchema>;

/** `POST /v1/api/contributor/drafts/:id/submit`: submits exactly this revision for review. */
export const SubmitContributorDraftSchema = z.object({ revision: z.number().int().positive() });
export type SubmitContributorDraft = z.infer<typeof SubmitContributorDraftSchema>;

export const ContributorDraftStatusSchema = z.enum(["draft", "submitted"]);

export const ContributorDraftSchema = z.object({
  id: z.number().int().positive(),
  zoneId: z.number().int().positive(),
  title: z.string(),
  lessonContent: z.array(AuthoredLessonBlockSchema),
  status: ContributorDraftStatusSchema,
  revision: z.number().int().positive(),
  /** The revision handed to review; set once and never changes. */
  submittedRevision: z.number().int().positive().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  submittedAt: z.string().nullable(),
});
export type ContributorDraft = z.infer<typeof ContributorDraftSchema>;

export const ContributorDraftListResponseSchema = z.array(ContributorDraftSchema);
export type ContributorDraftListResponse = z.infer<typeof ContributorDraftListResponseSchema>;
