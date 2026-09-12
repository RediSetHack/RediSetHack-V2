import { describe, expect, it, vi } from "vitest";

import { Quest, QuestOption, QuestQuestion } from "./domain/entities/quest.entity.js";
import { QuestNotFoundError } from "./domain/errors.js";
import { QuestRepository } from "./domain/ports/quest.repository.js";
import { StartQuestUseCase } from "./application/start-quest.use-case.js";
import { QuestPresenter } from "./presentation/presenters/quest.presenter.js";

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

describe("StartQuestUseCase", () => {
  it("throws QuestNotFoundError for a missing quest", async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const useCase = new StartQuestUseCase(repo);

    await expect(useCase.execute(999)).rejects.toBeInstanceOf(QuestNotFoundError);
  });

  it("returns the quest with its questions", async () => {
    const quest = new Quest(1, 10, "Loops 101", null, 60, 70, 50);
    const questions = [
      new QuestQuestion(1, "2 + 2?", [new QuestOption(1, "4", true), new QuestOption(2, "5", false)]),
    ];
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(quest),
      findQuestions: vi.fn().mockResolvedValue(questions),
    });
    const useCase = new StartQuestUseCase(repo);

    const session = await useCase.execute(1);

    expect(session.quest).toBe(quest);
    expect(session.questions).toBe(questions);
  });
});

describe("QuestPresenter.toSession (answer concealment)", () => {
  it("withholds isCorrect from every option", () => {
    const quest = new Quest(1, 10, "Loops 101", null, 60, 70, 50);
    const questions = [
      new QuestQuestion(1, "2 + 2?", [new QuestOption(1, "4", true), new QuestOption(2, "5", false)]),
    ];

    const response = QuestPresenter.toSession({ quest, questions });

    for (const question of response.questions) {
      for (const option of question.options) {
        expect(option).not.toHaveProperty("isCorrect");
      }
    }
  });
});
