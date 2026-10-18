import { describe, expect, it } from "vitest";
import { ProfileResponseSchema } from "./profile.schema.js";

describe("ProfileResponseSchema", () => {
  it("parses a profile with a chosen Character and badges", () => {
    const payload = {
      userId: "user_1",
      character: { id: 1, name: "Binary Knight", slug: "binary-knight", imageUrl: null },
      totalXp: 450,
      level: 3,
      badges: [
        {
          badgeDefinitionId: 1,
          name: "Pull Shark",
          slug: "pull-shark",
          imageUrl: null,
          count: 3,
          latestAwardedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      activity: [{ id: "123e4567-e89b-42d3-a456-426614174000", activityType: "quest", activityId: 7, occurredAt: "2026-01-02T00:00:00.000Z", outcome: { status: "submitted", passed: true, score: 100, xpAwarded: 20 } }],
      initialCompetencyBaseline: null,
    };

    expect(ProfileResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses a profile with no Character chosen yet", () => {
    const payload = {
      userId: "user_2",
      character: null,
      totalXp: 0,
      level: 1,
      badges: [],
      activity: [],
      initialCompetencyBaseline: null,
    };

    expect(ProfileResponseSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => ProfileResponseSchema.parse({ userId: 123 })).toThrow();
  });
});
