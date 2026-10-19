import { describe, expect, it } from "vitest";
import {
  DiscoveryItemSchema,
  DiscoveryResponseSchema,
  DISCOVERY_DEFAULT_LIMIT,
  DISCOVERY_MAX_LIMIT,
} from "./discovery.schema.js";

describe("DiscoveryItemSchema", () => {
  it("parses a valid Stage discovery item", () => {
    const payload = {
      kind: "stage" as const,
      id: 1,
      title: "For loops",
      slug: "for-loops",
      description: null,
      regionId: 1,
      regionName: "Foundations",
      zoneId: 1,
      zoneName: "Loops",
      competencies: [
        {
          id: "programming.control-flow",
          title: "Control flow",
          objective: "Use conditions and loops to control program behavior.",
        },
      ],
      difficulty: "beginner",
      xpReward: 50,
      sortOrder: 1,
      status: "available",
      lockReason: null,
    };

    expect(DiscoveryItemSchema.parse(payload)).toEqual(payload);
  });

  it("parses a valid Region discovery item", () => {
    const payload = {
      kind: "region" as const,
      id: 1,
      title: "Foundations",
      slug: "foundations",
      description: null,
      storyIntro: "A strange signal has reached the city.",
      sortOrder: 1,
    };

    expect(DiscoveryItemSchema.parse(payload)).toEqual(payload);
  });

  it("parses a valid Zone discovery item", () => {
    const payload = {
      kind: "zone" as const,
      id: 1,
      title: "Loops",
      slug: "loops",
      description: null,
      regionId: 1,
      regionName: "Foundations",
      sortOrder: 1,
    };

    expect(DiscoveryItemSchema.parse(payload)).toEqual(payload);
  });

  it("omits restricted content by never carrying lesson bodies", () => {
    const payload = {
      kind: "stage" as const,
      id: 1,
      title: "Locked stage",
      slug: "locked-stage",
      description: null,
      status: "locked",
      lockReason: "Complete the predecessor Stage first.",
    };

    const parsed = DiscoveryItemSchema.parse(payload);
    expect((parsed as Record<string, unknown>).lessonContent).toBeUndefined();
    expect(parsed.status).toBe("locked");
    expect(parsed.lockReason).toBe("Complete the predecessor Stage first.");
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => DiscoveryItemSchema.parse({ id: 1, kind: "bogus" })).toThrow();
  });
});

describe("DiscoveryResponseSchema", () => {
  it("parses an array of discovery items", () => {
    const payload = [
      {
        kind: "region" as const,
        id: 1,
        title: "Foundations",
        slug: "foundations",
        description: null,
        sortOrder: 1,
      },
    ];

    expect(DiscoveryResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty discovery list", () => {
    expect(DiscoveryResponseSchema.parse([])).toEqual([]);
  });
});

describe("discovery limits", () => {
  it("defines a bounded default and max limit", () => {
    expect(DISCOVERY_DEFAULT_LIMIT).toBeGreaterThan(0);
    expect(DISCOVERY_MAX_LIMIT).toBeGreaterThanOrEqual(DISCOVERY_DEFAULT_LIMIT);
  });
});
