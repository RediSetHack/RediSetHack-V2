import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DailyEvent } from "./domain/entities/daily-event.entity.js";
import { DailyEventRepository } from "./domain/ports/daily-event.repository.js";
import { GetTodayEventUseCase } from "./application/get-today-event.use-case.js";

function makeRepo(overrides: Partial<DailyEventRepository> = {}): DailyEventRepository {
  return {
    findByDate: vi.fn(),
    create: vi.fn(),
    ...overrides,
  };
}

describe("GetTodayEventUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns existing event when one exists for today", async () => {
    const existing = new DailyEvent(1, "2026-09-10", "normal", 1);
    const repo = makeRepo({
      findByDate: vi.fn().mockResolvedValue(existing),
    });
    vi.setSystemTime(new Date("2026-09-10T10:00:00+08:00"));

    const useCase = new GetTodayEventUseCase(repo);
    const result = await useCase.execute();

    expect(result).toBe(existing);
    expect(repo.findByDate).toHaveBeenCalledWith("2026-09-10");
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("creates new event on first request of the day", async () => {
    const created = new DailyEvent(1, "2026-09-10", "bonus", 2);
    const repo = makeRepo({
      findByDate: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(created),
    });
    vi.setSystemTime(new Date("2026-09-10T10:00:00+08:00"));

    const useCase = new GetTodayEventUseCase(repo);
    const result = await useCase.execute();

    expect(result).toBe(created);
    expect(repo.create).toHaveBeenCalledWith("2026-09-10", expect.any(String), expect.any(Number));
  });

  it("uses Asia/Manila timezone for today's date", async () => {
    const repo = makeRepo({ findByDate: vi.fn().mockResolvedValue(null), create: vi.fn() });
    // 2026-09-10T00:30:00+08:00 is still Sep 10 in Manila
    vi.setSystemTime(new Date("2026-09-10T00:30:00+08:00"));

    const useCase = new GetTodayEventUseCase(repo);
    await useCase.execute();

    expect(repo.create).toHaveBeenCalledWith("2026-09-10", expect.any(String), expect.any(Number));
  });

  it("rolls over at midnight Manila time, not UTC", async () => {
    const repo = makeRepo({ findByDate: vi.fn().mockResolvedValue(null), create: vi.fn() });
    // 2026-09-10T15:59:59Z = 2026-09-10 23:59:59 PST → still Sep 10
    vi.setSystemTime(new Date("2026-09-10T15:59:59Z"));

    const useCase = new GetTodayEventUseCase(repo);
    await useCase.execute();

    expect(repo.create).toHaveBeenCalledWith("2026-09-10", expect.any(String), expect.any(Number));
  });

  it("creates event for next day after midnight Manila", async () => {
    const repo = makeRepo({ findByDate: vi.fn().mockResolvedValue(null), create: vi.fn() });
    // 2026-09-10T16:00:00Z = 2026-09-11 00:00:00 PST
    vi.setSystemTime(new Date("2026-09-10T16:00:00Z"));

    const useCase = new GetTodayEventUseCase(repo);
    await useCase.execute();

    expect(repo.create).toHaveBeenCalledWith("2026-09-11", expect.any(String), expect.any(Number));
  });

  it("returns the same event for repeated calls on same day", async () => {
    const existing = new DailyEvent(1, "2026-09-10", "normal", 1);
    const repo = makeRepo({
      findByDate: vi.fn().mockResolvedValue(existing),
    });
    vi.setSystemTime(new Date("2026-09-10T10:00:00+08:00"));

    const useCase = new GetTodayEventUseCase(repo);
    const first = await useCase.execute();
    const second = await useCase.execute();

    expect(first).toBe(existing);
    expect(second).toBe(existing);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
