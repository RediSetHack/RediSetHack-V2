import { describe, expect, it } from "vitest";
import {
  ActivityBadgeCriteriaSchema,
  BadgeCriteriaSchema,
  BadgeDefinitionSchema,
  CategoryBadgeCriteriaSchema,
  CumulativeBadgeCriteriaSchema,
  EarnedBadgeSchema,
} from "./badge-definition.schema.js";

describe("BadgeCriteriaSchema", () => {
  it("parses valid cumulative criteria", () => {
    const payload = {
      trigger: "cumulative",
      target: "stage_completions",
      threshold: 5,
    };
    expect(CumulativeBadgeCriteriaSchema.parse(payload)).toEqual(payload);
    expect(BadgeCriteriaSchema.parse(payload)).toEqual(payload);
  });

  it("parses valid activity criteria", () => {
    const payload = {
      trigger: "activity",
      target: "quest_passes",
      threshold: 10,
    };
    expect(ActivityBadgeCriteriaSchema.parse(payload)).toEqual(payload);
    expect(BadgeCriteriaSchema.parse(payload)).toEqual(payload);
  });

  it("parses valid category criteria", () => {
    const payload = {
      trigger: "category",
      target: "zone_completion",
      zoneId: 3,
    };
    expect(CategoryBadgeCriteriaSchema.parse(payload)).toEqual(payload);
    expect(BadgeCriteriaSchema.parse(payload)).toEqual(payload);
  });

  it("throws on unsupported targets or triggers", () => {
    expect(() =>
      BadgeCriteriaSchema.parse({
        trigger: "cumulative",
        target: "unsupported",
        threshold: 5,
      }),
    ).toThrow();

    expect(() =>
      BadgeCriteriaSchema.parse({
        trigger: "category",
        target: "zone_completion",
        zoneId: -1,
      }),
    ).toThrow();

    expect(() =>
      BadgeCriteriaSchema.parse({
        trigger: "unknown",
        target: "stage_completions",
        threshold: 5,
      }),
    ).toThrow();
  });
});

describe("BadgeDefinitionSchema", () => {
  it("parses a valid badge definition", () => {
    const payload = {
      id: 1,
      name: "Loop Master",
      slug: "loop-master",
      description: "Master of loops",
      criteria: {
        trigger: "category" as const,
        target: "zone_completion" as const,
        zoneId: 2,
      },
      imageUrl: "https://example.com/badge.png",
    };
    expect(BadgeDefinitionSchema.parse(payload)).toEqual(payload);
  });
});

describe("EarnedBadgeSchema", () => {
  it("parses a valid earned badge", () => {
    const payload = {
      id: 1,
      name: "Streaker",
      slug: "streaker",
      description: null,
      criteria: {
        trigger: "cumulative" as const,
        target: "stage_completions" as const,
        threshold: 5,
      },
      imageUrl: null,
      count: 2,
      awardedAt: [new Date().toISOString()],
    };
    expect(EarnedBadgeSchema.parse(payload)).toEqual(payload);
  });
});
