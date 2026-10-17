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
      competencies: [{ id: "programming.control-flow", title: "Control flow", objective: "Use conditions and loops to control program behavior." }],
      difficulty: "beginner",
      status: "available" as const,
      lockReason: null,
    };

    expect(StageSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => StageSchema.parse({ id: 1, status: "bogus" })).toThrow();
  });

  it("rejects unknown competency identifiers and difficulty values", () => {
    const payload = { id: 1, zoneId: 1, title: "Loops", slug: "loops", xpReward: 0, sortOrder: 0, status: "available", lockReason: null, competencies: [{ id: "foreign.skill", title: "Foreign", objective: "?" }], difficulty: "expert" };
    expect(() => StageSchema.parse(payload)).toThrow();
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
      lockReason: null,
      },
    ];

    expect(StageListResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty Stage list", () => {
    expect(StageListResponseSchema.parse([])).toEqual([]);
  });
});
