import { describe, expect, it } from "vitest";

import type { LeaderboardEntry } from "@/lib/api-client";
import {
  displayName,
  findCurrentUserEntry,
  isCurrentUser,
  podiumEntries,
  podiumOrderClass,
  podiumPlaceLabel,
} from "./leaderboard";

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    userId: "user-1",
    name: "Ada Lovelace",
    totalXp: 1240,
    level: 4,
    ...overrides,
  };
}

describe("podiumEntries", () => {
  it("returns the ranks 1 to 3 of page 1 in rank order", () => {
    const entries = [
      makeEntry({ rank: 3, userId: "user-3" }),
      makeEntry({ rank: 1, userId: "user-1" }),
      makeEntry({ rank: 2, userId: "user-2" }),
      makeEntry({ rank: 4, userId: "user-4" }),
    ];

    const podium = podiumEntries(entries, 1);

    expect(podium.map((slot) => slot.place)).toEqual([1, 2, 3]);
    expect(podium.map((slot) => slot.entry.userId)).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
  });

  it("returns nothing on pages after the first", () => {
    const entries = [makeEntry({ rank: 21, userId: "user-21" })];

    expect(podiumEntries(entries, 2)).toEqual([]);
  });

  it("only returns the places that exist", () => {
    const entries = [makeEntry({ rank: 1 }), makeEntry({ rank: 2, userId: "user-2" })];

    const podium = podiumEntries(entries, 1);

    expect(podium.map((slot) => slot.place)).toEqual([1, 2]);
  });

  it("returns nothing for an empty leaderboard", () => {
    expect(podiumEntries([], 1)).toEqual([]);
  });
});

describe("podiumOrderClass", () => {
  it("centres the first place and flanks it with the other two", () => {
    expect(podiumOrderClass(1)).toBe("sm:order-2");
    expect(podiumOrderClass(2)).toBe("sm:order-1");
    expect(podiumOrderClass(3)).toBe("sm:order-3");
  });
});

describe("podiumPlaceLabel", () => {
  it("labels every place", () => {
    expect(podiumPlaceLabel(1)).toBe("1ST PLACE");
    expect(podiumPlaceLabel(2)).toBe("2ND PLACE");
    expect(podiumPlaceLabel(3)).toBe("3RD PLACE");
  });
});

describe("displayName", () => {
  it("falls back to Anonymous when the learner has no name", () => {
    expect(displayName(makeEntry({ name: null }))).toBe("Anonymous");
    expect(displayName(makeEntry({ name: "Grace Hopper" }))).toBe("Grace Hopper");
  });
});

describe("current learner", () => {
  const entries = [
    makeEntry({ rank: 1, userId: "user-1" }),
    makeEntry({ rank: 2, userId: "user-2" }),
  ];

  it("knows which row belongs to the signed-in learner", () => {
    expect(isCurrentUser(entries[1], "user-2")).toBe(true);
    expect(isCurrentUser(entries[1], "user-3")).toBe(false);
    expect(isCurrentUser(entries[1], null)).toBe(false);
  });

  it("finds the signed-in learner's own row", () => {
    expect(findCurrentUserEntry(entries, "user-2")?.rank).toBe(2);
    expect(findCurrentUserEntry(entries, "user-9")).toBeNull();
    expect(findCurrentUserEntry(entries, null)).toBeNull();
  });
});
