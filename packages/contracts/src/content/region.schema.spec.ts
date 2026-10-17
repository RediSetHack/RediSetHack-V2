import { describe, expect, it } from "vitest";
import { RegionListResponseSchema, RegionSchema } from "./region.schema.js";

describe("RegionSchema", () => {
  it("parses a valid Region payload", () => {
    const payload = {
      id: 1,
      name: "Foundations",
      slug: "foundations",
      description: "Where every learner starts.",
      sortOrder: 1,
      storyIntro: null,
    };

    expect(RegionSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => RegionSchema.parse({ id: "not-a-number" })).toThrow();
  });
});

describe("RegionListResponseSchema", () => {
  it("parses an array of Regions", () => {
    const payload = [
      {
        id: 1,
        name: "Foundations",
        slug: "foundations",
        description: null,
        sortOrder: 1,
        storyIntro: null,
      },
    ];

    expect(RegionListResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty catalog", () => {
    expect(RegionListResponseSchema.parse([])).toEqual([]);
  });

  it("preserves a designated Novel's story introduction", () => {
    const novel = {
      id: 1,
      name: "The Signal at Dawn",
      slug: "signal-at-dawn",
      description: null,
      sortOrder: 1,
      storyIntro: "A strange signal has reached the city.",
    };
    expect(RegionSchema.parse(novel)).toEqual(novel);
  });
});
