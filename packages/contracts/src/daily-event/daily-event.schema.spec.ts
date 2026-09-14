import { describe, expect, it } from "vitest";
import { DailyEventResponseSchema } from "./daily-event.schema.js";

describe("DailyEventResponseSchema", () => {
  it("parses a normal day", () => {
    const payload = { id: 1, eventDate: "2026-09-14", eventType: "normal", xpMultiplier: 1 };
    expect(DailyEventResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses a bonus day", () => {
    const payload = { id: 2, eventDate: "2026-09-15", eventType: "bonus", xpMultiplier: 2 };
    expect(DailyEventResponseSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an unknown eventType", () => {
    expect(() =>
      DailyEventResponseSchema.parse({
        id: 1,
        eventDate: "2026-09-14",
        eventType: "double-bonus",
        xpMultiplier: 1,
      }),
    ).toThrow();
  });
});
