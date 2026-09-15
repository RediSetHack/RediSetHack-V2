import { z } from "zod";

/** Server-computed progression status for a Stage; never recomputed client-side. */
export const StageStatusSchema = z.enum(["locked", "available", "completed"]);
export type StageStatus = z.infer<typeof StageStatusSchema>;

/**
 * A single Stage, as returned by `StagePresenter` in `apps/api`. `status` is
 * computed server-side by `ListStagesUseCase`. `lessonContent` is the raw
 * structured block array; its schema belongs to the ticket that renders it.
 */
export const StageSchema = z.object({
  id: z.number().int().positive(),
  zoneId: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  lessonContent: z.unknown(),
  xpReward: z.number().int().nonnegative(),
  sortOrder: z.number().int(),
  status: StageStatusSchema,
});
export type Stage = z.infer<typeof StageSchema>;

/** A Zone's Stage listing, `GET /v1/api/zones/:zoneId/stages`. */
export const StageListResponseSchema = z.array(StageSchema);
export type StageListResponse = z.infer<typeof StageListResponseSchema>;
