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
      { id: 1, name: "Foundations", slug: "foundations", description: null, sortOrder: 1 },
    ];

    expect(RegionListResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty catalog", () => {
    expect(RegionListResponseSchema.parse([])).toEqual([]);
  });
});
