import { describe, expect, it } from "vitest";
import { LeaderboardResponseSchema } from "./leaderboard.schema.js";

describe("LeaderboardResponseSchema", () => {
  it("parses a page of ranked entries", () => {
    const payload = {
      page: 1,
      limit: 20,
      total: 2,
      entries: [
        { rank: 1, userId: "user_1", name: "Ada", totalXp: 900, level: 5 },
        { rank: 2, userId: "user_2", name: null, totalXp: 400, level: 3 },
      ],
    };

    expect(LeaderboardResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty page", () => {
    const payload = { page: 1, limit: 20, total: 0, entries: [] };

    expect(LeaderboardResponseSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => LeaderboardResponseSchema.parse({ page: 1 })).toThrow();
  });
});
