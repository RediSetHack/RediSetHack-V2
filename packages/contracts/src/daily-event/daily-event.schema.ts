import { z } from "zod";

/**
 * Today's Event, as returned by `DailyEventPresenter` in `apps/api`
 * (`GET /v1/api/events/today`). `eventType: "bonus"` carries an
 * `xpMultiplier` above 1.
 */
export const DailyEventResponseSchema = z.object({
  id: z.number().int().positive(),
  eventDate: z.string(),
  eventType: z.enum(["normal", "bonus"]),
  xpMultiplier: z.number().positive(),
});
export type DailyEventResponse = z.infer<typeof DailyEventResponseSchema>;
