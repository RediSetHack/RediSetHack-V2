import { describe, expect, it } from "vitest";

import {
  badgeAwards,
  badgeDefinitions,
  characters,
  dailyEvents,
  quests,
  regions,
  results,
  stages,
  userProgress,
  users,
  zones,
} from "@repo/db";

describe("database schema (issue #6)", () => {
  it("exposes the required domain tables", () => {
    const tables = [users, characters, regions, zones, stages, quests, results, badgeDefinitions, badgeAwards, userProgress, dailyEvents];
    const nameOf = (table: object) =>
      (table as Record<PropertyKey, unknown>)[Symbol.for("drizzle:Name")];
    expect(tables).toHaveLength(11);
    expect(tables.map(nameOf)).toEqual(
      expect.arrayContaining([
        "users",
        "characters",
        "regions",
        "zones",
        "stages",
        "quests",
        "results",
        "badge_definitions",
        "badge_awards",
        "user_progress",
        "daily_events",
      ]),
    );
  });

  it("models auth-critical columns on users", () => {
    expect(users.id.primary).toBe(true);
    expect(users.id.dataType).toBe("string");
    expect(users.email.dataType).toBe("string");
    expect(users.characterId).toBeDefined();
    expect(users.totalXp).toBeDefined();
  });

  it("links quests to stages and zones to regions", () => {
    expect(quests.stageId).toBeDefined();
    expect(zones.regionId).toBeDefined();
  });

  it("allows repeated badge awards per user", () => {
    expect(badgeAwards.userId).toBeDefined();
    expect(badgeAwards.awardedAt).toBeDefined();
  });
});