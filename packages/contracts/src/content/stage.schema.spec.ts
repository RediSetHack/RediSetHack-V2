import { describe, expect, it } from "vitest";
import { StageListResponseSchema, StageSchema, StageStatusSchema } from "./stage.schema.js";

describe("StageStatusSchema", () => {
  it("accepts locked, available, and completed", () => {
    for (const status of ["locked", "available", "completed"]) {
      expect(StageStatusSchema.parse(status)).toBe(status);
    }
  });

  it("rejects a status the server never sends", () => {
    expect(() => StageStatusSchema.parse("in-progress")).toThrow();
  });
});

describe("StageSchema", () => {
  it("parses a valid Stage payload", () => {
    const payload = {
      id: 1,
      zoneId: 1,
      title: "For loops",
      slug: "for-loops",
      lessonContent: [{ type: "text", content: "Loops repeat code." }],
      xpReward: 50,
      sortOrder: 1,
      status: "available" as const,
    };

    expect(StageSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => StageSchema.parse({ id: 1, status: "bogus" })).toThrow();
  });
});

describe("StageListResponseSchema", () => {
  it("parses an array of Stages", () => {
    const payload = [
      {
        id: 1,
        zoneId: 1,
        title: "For loops",
        slug: "for-loops",
        lessonContent: [],
        xpReward: 50,
        sortOrder: 1,
        status: "available" as const,
      },
    ];

    expect(StageListResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty Stage list", () => {
    expect(StageListResponseSchema.parse([])).toEqual([]);
  });
});
