import { describe, expect, it, vi } from "vitest";

import { GetLearningStreakUseCase } from "./application/get-learning-streak.use-case.js";
import { InvalidStreakRangeError } from "./domain/learning-streak.js";
import type { ProfileRepository } from "./domain/ports/profile.repository.js";

const day = (date: string, reading = 1, assessed = 0) => ({ date, reading, assessed });
const useCaseWith = (history: ReturnType<typeof day>[]) =>
  new GetLearningStreakUseCase({ findDailyLearningActivity: vi.fn().mockResolvedValue(history) } as unknown as ProfileRepository);
// 2026-10-19 09:00 Asia/Manila
const NOW = new Date("2026-10-19T01:00:00Z");

describe("GetLearningStreakUseCase", () => {
  it("rolls the day over at midnight Asia/Manila (16:00 UTC)", async () => {
    const useCase = useCaseWith([]);
    expect((await useCase.execute("u", undefined, undefined, new Date("2026-10-18T15:59:59Z"))).today).toBe("2026-10-18");
    expect((await useCase.execute("u", undefined, undefined, new Date("2026-10-18T16:00:00Z"))).today).toBe("2026-10-19");
  });

  it("counts consecutive days and keeps the current streak alive until today ends", async () => {
    const history = [day("2026-10-15"), day("2026-10-16"), day("2026-10-17"), day("2026-10-18", 0, 2)];
    const result = await useCaseWith(history).execute("u", undefined, undefined, NOW);
    expect(result).toMatchObject({ currentStreak: 4, longestStreak: 4 });
    expect(result.days.at(-2)).toEqual(day("2026-10-18", 0, 2));
    expect(result.days.at(-1)).toEqual(day("2026-10-19", 0, 0));
  });

  it("resets the current streak after a whole empty day but keeps the longest", async () => {
    const history = [day("2026-10-10"), day("2026-10-11"), day("2026-10-12"), day("2026-10-17")];
    expect(await useCaseWith(history).execute("u", undefined, undefined, NOW)).toMatchObject({ currentStreak: 0, longestStreak: 3 });
  });

  it("reports zero streaks for a learner with no activity", async () => {
    expect(await useCaseWith([]).execute("u", "2026-10-01", "2026-10-03", NOW)).toMatchObject({
      currentStreak: 0,
      longestStreak: 0,
      days: [day("2026-10-01", 0), day("2026-10-02", 0), day("2026-10-03", 0)],
    });
  });

  it("counts backfilled history by the day it occurred, including a streak outside the range", async () => {
    const history = [day("2026-01-01"), day("2026-01-02"), day("2026-01-03")];
    const result = await useCaseWith(history).execute("u", "2026-10-01", "2026-10-02", NOW);
    expect(result.longestStreak).toBe(3);
    expect(result.days.every((d) => d.reading + d.assessed === 0)).toBe(true);
  });

  it("returns the same history for the same range whenever it is requested", async () => {
    const useCase = useCaseWith([day("2026-10-17"), day("2026-10-18")]);
    const a = await useCase.execute("u", "2026-10-15", "2026-10-18", new Date("2026-10-19T01:00:00Z"));
    const b = await useCase.execute("u", "2026-10-15", "2026-10-18", new Date("2026-10-19T15:59:00Z"));
    expect(b.days).toEqual(a.days);
  });

  it.each([
    ["future end date", "2026-10-01", "2026-10-20"],
    ["inverted range", "2026-10-05", "2026-10-01"],
    ["oversized range", "2025-01-01", "2026-10-19"],
    ["malformed date", "yesterday", "2026-10-19"],
    ["impossible date", "2026-02-30", "2026-10-19"],
  ])("rejects a %s", async (_name, from, to) => {
    await expect(useCaseWith([]).execute("u", from, to, NOW)).rejects.toBeInstanceOf(InvalidStreakRangeError);
  });

  it("rejects a future day just before Manila midnight but accepts it after", async () => {
    const useCase = useCaseWith([]);
    await expect(useCase.execute("u", "2026-10-19", "2026-10-19", new Date("2026-10-18T15:59:59Z"))).rejects.toBeInstanceOf(InvalidStreakRangeError);
    await expect(useCase.execute("u", "2026-10-19", "2026-10-19", new Date("2026-10-18T16:00:00Z"))).resolves.toBeTruthy();
  });
});
