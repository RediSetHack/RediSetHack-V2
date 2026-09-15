import { describe, expect, it } from "vitest";
import { ZoneListResponseSchema, ZoneSchema } from "./zone.schema.js";

describe("ZoneSchema", () => {
  it("parses a valid Zone payload", () => {
    const payload = {
      id: 1,
      regionId: 1,
      name: "Loops",
      slug: "loops",
      description: "Repetition constructs.",
      sortOrder: 1,
    };

    expect(ZoneSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => ZoneSchema.parse({ id: 1 })).toThrow();
  });
});

describe("ZoneListResponseSchema", () => {
  it("parses an array of Zones", () => {
    const payload = [
      { id: 1, regionId: 1, name: "Loops", slug: "loops", description: null, sortOrder: 1 },
    ];

    expect(ZoneListResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty Zone list", () => {
    expect(ZoneListResponseSchema.parse([])).toEqual([]);
  });
});
