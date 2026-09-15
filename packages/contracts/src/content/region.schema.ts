import { z } from "zod";

/** A single Region, as returned by `RegionPresenter` in `apps/api`. */
export const RegionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
});
export type Region = z.infer<typeof RegionSchema>;

/** The catalog's Region listing, `GET /v1/api/regions`. */
export const RegionListResponseSchema = z.array(RegionSchema);
export type RegionListResponse = z.infer<typeof RegionListResponseSchema>;
