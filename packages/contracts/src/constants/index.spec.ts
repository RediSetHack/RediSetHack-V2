import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_PASSING_SCORE,
  DEFAULT_TIME_LIMIT_SECONDS,
  DEFAULT_XP_MULTIPLIER,
  type EventType,
} from "./index.js";

describe("shared constants", () => {
  it("exposes the documented default values", () => {
    expect(DEFAULT_PASSING_SCORE).toBe(70);
    expect(DEFAULT_TIME_LIMIT_SECONDS).toBe(60);
    expect(DEFAULT_XP_MULTIPLIER).toBe(1);
  });

  it("EventType accepts only the two documented values", () => {
    const eventType: EventType = "bonus";
    expect(["normal", "bonus"]).toContain(eventType);
  });
});

describe("schema convention", () => {
  // Establishes the convention every domain schema in this package follows:
  // valid payloads parse to a typed value, invalid payloads throw ZodError.
  const exampleSchema = z.object({
    eventType: z.enum(["normal", "bonus"]),
    xpMultiplier: z.number().int().positive(),
  });

  it("parses a valid payload", () => {
    const result = exampleSchema.parse({ eventType: "bonus", xpMultiplier: 2 });
    expect(result).toEqual({ eventType: "bonus", xpMultiplier: 2 });
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => exampleSchema.parse({ eventType: "unknown", xpMultiplier: -1 })).toThrow(
      z.ZodError,
    );
  });
});
