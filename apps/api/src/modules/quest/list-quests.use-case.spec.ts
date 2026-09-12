import { describe, expect, it, vi } from "vitest";

import { Quest } from "./domain/entities/quest.entity.js";
import { QuestRepository } from "./domain/ports/quest.repository.js";
import { ListQuestsUseCase } from "./application/list-quests.use-case.js";

function makeRepo(overrides: Partial<QuestRepository> = {}): QuestRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findQuestions: vi.fn(),
    findPassedQuestIds: vi.fn(),
    createResult: vi.fn(),
    findResultById: vi.fn(),
    claimXpAward: vi.fn(),
    ...overrides,
  };
}

describe("ListQuestsUseCase", () => {
  it("marks quests the user has passed as completed", async () => {
    const quests = [
      new Quest(1, 10, "Loops", null, 60, 70, 50),
      new Quest(2, 10, "Conditionals", null, 60, 70, 50),
    ];
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue(quests),
      findPassedQuestIds: vi.fn().mockResolvedValue(new Set([1])),
    });
    const useCase = new ListQuestsUseCase(repo);

    const result = await useCase.execute("user_1");

    expect(result).toEqual([
      { quest: quests[0], completed: true },
      { quest: quests[1], completed: false },
    ]);
  });

  it("marks every quest incomplete for a user with no passed attempts", async () => {
    const quests = [new Quest(1, 10, "Loops", null, 60, 70, 50)];
    const repo = makeRepo({
      findAll: vi.fn().mockResolvedValue(quests),
      findPassedQuestIds: vi.fn().mockResolvedValue(new Set()),
    });
    const useCase = new ListQuestsUseCase(repo);

    const result = await useCase.execute("user_1");

    expect(result).toEqual([{ quest: quests[0], completed: false }]);
  });
});
