import { z } from "zod";

/** Query for the restricted research export (`GET /v1/api/admin/research/dataset`). */
export const DatasetExportQuerySchema = z.object({
  strategy: z.enum(["learner", "time"]).default("learner"),
  limit: z.coerce.number().int().min(1).max(50000).default(10000),
  seed: z.string().min(1).max(64).default("v1"),
});
export type DatasetExportQuery = z.infer<typeof DatasetExportQuerySchema>;

export const DatasetSplitSchema = z.enum(["train", "validation", "test"]);
export type DatasetSplit = z.infer<typeof DatasetSplitSchema>;

/** One accepted learning interaction. Identifiers are keyed pseudonyms; no raw code, answers or chat. Unknown values are `null`, never defaulted. */
export const DatasetRowSchema = z.object({
  eventId: z.string(),
  learnerId: z.string(),
  split: DatasetSplitSchema,
  activityType: z.enum(["quest", "reading", "coding", "ctf", "side_quest"]),
  activityId: z.number().int(),
  skills: z.array(z.string()),
  difficulty: z.string().nullable(),
  contentVersion: z.string(),
  occurredAt: z.string(),
  elapsedMs: z.number().int().nullable(),
  elapsedDefinition: z.string(),
  assessed: z.boolean().nullable(),
  correctness: z.boolean().nullable(),
  status: z.string().nullable(),
  errorCategories: z.array(z.string()),
  hintCount: z.number().int().nullable(),
});
export type DatasetRow = z.infer<typeof DatasetRowSchema>;

const SplitCountsSchema = z.object({ rows: z.number().int(), learners: z.number().int(), correct: z.number().int(), incorrect: z.number().int(), unlabeled: z.number().int() });

export const DatasetReportSchema = z.object({
  counts: z.object({ train: SplitCountsSchema, validation: SplitCountsSchema, test: SplitCountsSchema }),
  /** Learners present in more than one split. Must be 0 for the `learner` strategy; expected for `time`. */
  learnersInMultipleSplits: z.number().int(),
  /** Every train event strictly precedes every validation event, which strictly precede every test event. Only guaranteed for `time`. */
  chronologicallySeparated: z.boolean(),
  missingValues: z.record(z.string(), z.number().int()),
  exclusions: z.object({ deletedLearnerRows: z.number().int(), truncatedByLimit: z.boolean() }),
});
export type DatasetReport = z.infer<typeof DatasetReportSchema>;

export const DatasetExportSchema = z.object({
  manifest: z.object({
    schemaVersion: z.literal(1),
    /** Content hash of `rows`: identical inputs and parameters always give the same id. */
    datasetId: z.string(),
    strategy: z.enum(["learner", "time"]),
    seed: z.string(),
    limit: z.number().int(),
    generatedAt: z.string(),
  }),
  report: DatasetReportSchema,
  rows: z.array(DatasetRowSchema),
});
export type DatasetExport = z.infer<typeof DatasetExportSchema>;
