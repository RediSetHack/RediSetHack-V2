import { describe, expect, it, vi } from "vitest";
import type { Database } from "@repo/db";

import { DrizzleProfileRepository } from "./infrastructure/drizzle-profile.repository.js";

describe("DrizzleProfileRepository", () => {
  it("orders the leaderboard by descending XP and paginates by offset", async () => {
    const rows = [
      { userId: "user_1", name: "Top Learner", totalXp: 900 },
      { userId: "user_2", name: "Runner Up", totalXp: 400 },
    ];
    const offsetMock = vi.fn().mockResolvedValue(rows);
    const limitMock = vi.fn().mockReturnValue({ offset: offsetMock });
    const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
    const rowsFromMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
    const countFromMock = vi.fn().mockResolvedValue([{ count: 5 }]);
    const selectMock = vi
      .fn()
      .mockReturnValueOnce({ from: rowsFromMock })
      .mockReturnValueOnce({ from: countFromMock });
    const mockDb = { select: selectMock } as unknown as Database;

    const repo = new DrizzleProfileRepository(mockDb);
    const result = await repo.findLeaderboardPage(2, 10);

    expect(orderByMock).toHaveBeenCalledTimes(1);
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(offsetMock).toHaveBeenCalledWith(10); // page 2, limit 10 -> skip first 10
    expect(result).toEqual({ rows, total: 5 });
  });

  it("aggregates repeated badge awards into a count and latest award date", async () => {
    const latestAwardedAt = new Date("2026-02-01");
    const badgeRows = [
      {
        badgeDefinitionId: 1,
        name: "Pull Shark",
        slug: "pull-shark",
        imageUrl: null,
        count: 3,
        latestAwardedAt,
      },
    ];
    const groupByMock = vi.fn().mockResolvedValue(badgeRows);
    const whereMock = vi.fn().mockReturnValue({ groupBy: groupByMock });
    const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
    const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
    const selectMock = vi.fn().mockReturnValue({ from: fromMock });
    const mockDb = {
      select: selectMock,
      query: {
        users: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: "user_1", totalXp: 450, characterId: 7 }),
        },
        characters: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ id: 7, name: "Kalayaan", slug: "kalayaan", imageUrl: null }),
        },
      },
    } as unknown as Database;

    const repo = new DrizzleProfileRepository(mockDb);
    const result = await repo.findProfileByUserId("user_1");

    expect(groupByMock).toHaveBeenCalledTimes(1);
    expect(result?.badges).toEqual([
      expect.objectContaining({ name: "Pull Shark", count: 3, latestAwardedAt }),
    ]);
    expect(result?.character).toEqual({ id: 7, name: "Kalayaan", slug: "kalayaan", imageUrl: null });
  });

  it("returns null when the user does not exist", async () => {
    const mockDb = {
      query: { users: { findFirst: vi.fn().mockResolvedValue(null) } },
    } as unknown as Database;

    const repo = new DrizzleProfileRepository(mockDb);

    expect(await repo.findProfileByUserId("missing_user")).toBeNull();
  });
});
