import { describe, expect, it, vi } from "vitest";

import { Stage } from "../content/domain/entities/stage.entity.js";
import type { StageRepository } from "../content/domain/ports/stage.repository.js";
import { GetStageLessonUseCase } from "./application/get-stage-lesson.use-case.js";
import { StageLockedError, StageNotFoundError } from "./domain/errors.js";

const stages: Stage[] = [
  new Stage(
    1,
    1,
    "Intro",
    "intro",
    JSON.stringify([{ type: "text", content: "Hello" }]),
    10,
    0,
  ),
  new Stage(
    2,
    1,
    "Basics",
    "basics",
    JSON.stringify([{ type: "code", language: "js", content: "console.log(1)" }]),
    20,
    1,
  ),
  new Stage(3, 1, "Advanced", "advanced", null, 30, 2),
];

function makeRepo(overrides: Partial<StageRepository> = {}): StageRepository {
  return {
    findById: vi.fn(),
    findByZoneId: vi.fn().mockResolvedValue(stages),
    findCompletedStageIds: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("GetStageLessonUseCase", () => {
  it("returns lesson blocks for stage 1 without any progression", async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(stages[0]) });
    const useCase = new GetStageLessonUseCase(repo);

    const lesson = await useCase.execute("user_1", 1);

    expect(lesson.status).toBe("available");
    expect(lesson.blocks).toEqual([{ type: "text", content: "Hello" }]);
  });

  it("returns lesson blocks for a stage whose predecessor is completed", async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1]),
    });
    const useCase = new GetStageLessonUseCase(repo);

    const lesson = await useCase.execute("user_1", 2);

    expect(lesson.blocks).toEqual([
      { type: "code", language: "js", content: "console.log(1)" },
    ]);
  });

  it("marks a completed stage as completed", async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(stages[1]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1, 2]),
    });
    const useCase = new GetStageLessonUseCase(repo);

    const lesson = await useCase.execute("user_1", 2);

    expect(lesson.status).toBe("completed");
  });

  it("returns empty blocks when lesson content is null", async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(stages[2]),
      findCompletedStageIds: vi.fn().mockResolvedValue([1, 2]),
    });
    const useCase = new GetStageLessonUseCase(repo);

    const lesson = await useCase.execute("user_1", 3);

    expect(lesson.blocks).toEqual([]);
  });

  it("throws StageLockedError when predecessor is not completed", async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(stages[1]) });
    const useCase = new GetStageLessonUseCase(repo);

    await expect(useCase.execute("user_1", 2)).rejects.toBeInstanceOf(StageLockedError);
  });

  it("throws StageNotFoundError when stage does not exist", async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const useCase = new GetStageLessonUseCase(repo);

    await expect(useCase.execute("user_1", 999)).rejects.toBeInstanceOf(StageNotFoundError);
  });
});