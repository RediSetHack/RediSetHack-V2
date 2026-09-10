import { describe, expect, it, vi } from "vitest";

import { Stage } from "./domain/entities/stage.entity.js";
import { StageRepository } from "./domain/ports/stage.repository.js";
import { ListStagesUseCase } from "./application/list-stages.use-case.js";

const stages: Stage[] = [
  new Stage(1, 1, "Intro", "intro", "content1", 10, 0),
  new Stage(2, 1, "Basics", "basics", "content2", 20, 1),
  new Stage(3, 1, "Advanced", "advanced", "content3", 30, 2),
];

function makeRepo(completedIds: number[]): StageRepository {
  return {
    findByZoneId: vi.fn().mockResolvedValue(stages),
    findCompletedStageIds: vi.fn().mockResolvedValue(completedIds),
  };
}

describe("ListStagesUseCase", () => {
  it("marks stage 1 as available when no stages are completed", async () => {
    const repo = makeRepo([]);
    const useCase = new ListStagesUseCase(repo);

    const result = await useCase.execute("user_1", 1);

    expect(result[0]!.status).toBe("available");
    expect(result[1]!.status).toBe("locked");
    expect(result[2]!.status).toBe("locked");
  });

  it("marks stage 1 as completed and stage 2 as available when stage 1 is done", async () => {
    const repo = makeRepo([1]);
    const useCase = new ListStagesUseCase(repo);

    const result = await useCase.execute("user_1", 1);

    expect(result[0]!.status).toBe("completed");
    expect(result[1]!.status).toBe("available");
    expect(result[2]!.status).toBe("locked");
  });

  it("marks all stages as completed when all are done", async () => {
    const repo = makeRepo([1, 2, 3]);
    const useCase = new ListStagesUseCase(repo);

    const result = await useCase.execute("user_1", 1);

    expect(result[0]!.status).toBe("completed");
    expect(result[1]!.status).toBe("completed");
    expect(result[2]!.status).toBe("completed");
  });

  it("marks non-sequential completed stages correctly", async () => {
    const repo = makeRepo([1, 3]);
    const useCase = new ListStagesUseCase(repo);

    const result = await useCase.execute("user_1", 1);

    expect(result[0]!.status).toBe("completed");
    expect(result[1]!.status).toBe("available");
    expect(result[2]!.status).toBe("completed");
  });

  it("sorts stages by sortOrder regardless of id order", async () => {
    const unsorted: Stage[] = [
      new Stage(3, 1, "Advanced", "advanced", null, 30, 2),
      new Stage(1, 1, "Intro", "intro", null, 10, 0),
      new Stage(2, 1, "Basics", "basics", null, 20, 1),
    ];
    const repo: StageRepository = {
      findByZoneId: vi.fn().mockResolvedValue(unsorted),
      findCompletedStageIds: vi.fn().mockResolvedValue([]),
    };
    const useCase = new ListStagesUseCase(repo);

    const result = await useCase.execute("user_1", 1);

    expect(result[0]!.id).toBe(1);
    expect(result[0]!.status).toBe("available");
    expect(result[1]!.id).toBe(2);
    expect(result[1]!.status).toBe("locked");
    expect(result[2]!.id).toBe(3);
    expect(result[2]!.status).toBe("locked");
  });
});
