import { z } from "zod";

/** A single Zone, as returned by `ZonePresenter` in `apps/api`. */
export const ZoneSchema = z.object({
  id: z.number().int().positive(),
  regionId: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
});
export type Zone = z.infer<typeof ZoneSchema>;

/** A Region's Zone listing, `GET /v1/api/regions/:regionId/zones`. */
export const ZoneListResponseSchema = z.array(ZoneSchema);
export type ZoneListResponse = z.infer<typeof ZoneListResponseSchema>;
