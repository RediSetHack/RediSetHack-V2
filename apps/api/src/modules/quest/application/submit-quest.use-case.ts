import { Injectable } from "@nestjs/common";

import { UserRepository } from "../../auth/domain/ports/user.repository.js";
import { EvaluateBadgesUseCase } from "../../badge/application/evaluate-badges.use-case.js";
import { GetTodayEventUseCase } from "../../daily-event/application/get-today-event.use-case.js";
import { QuestQuestion } from "../domain/entities/quest.entity.js";
import { QuestResult, type QuestResponse } from "../domain/entities/quest-result.entity.js";
import { QuestNotFoundError } from "../domain/errors.js";
import { QuestRepository } from "../domain/ports/quest.repository.js";

export type SubmitQuestInput = {
  userId: string;
  questId: number;
  responses: QuestResponse[];
};

export type SubmitQuestOutput = {
  result: QuestResult;
  xpAwarded: number;
};

function scorePercent(questions: QuestQuestion[], responses: QuestResponse[]): number {
  if (questions.length === 0) return 0;

  const chosenByQuestion = new Map(responses.map((r) => [r.questionId, r.optionId]));
  const correctCount = questions.filter((question) => {
    const chosenOptionId = chosenByQuestion.get(question.id);
    const correctOption = question.options.find((option) => option.isCorrect);
    return chosenOptionId !== undefined && correctOption?.id === chosenOptionId;
  }).length;

  return Math.round((correctCount / questions.length) * 100);
}

@Injectable()
export class SubmitQuestUseCase {
  constructor(
    private readonly quests: QuestRepository,
    private readonly users: UserRepository,
    private readonly getTodayEvent: GetTodayEventUseCase,
    private readonly evaluateBadges: EvaluateBadgesUseCase,
  ) {}

  async execute(input: SubmitQuestInput): Promise<SubmitQuestOutput> {
    const quest = await this.quests.findById(input.questId);
    if (!quest) {
      throw new QuestNotFoundError(input.questId);
    }

    const questions = await this.quests.findQuestions(input.questId);
    const score = scorePercent(questions, input.responses);
    const passed = score >= quest.passingScore;

    const result = await this.quests.createResult({
      userId: input.userId,
      questId: input.questId,
      score,
      passed,
      responses: input.responses,
    });

    let xpAwarded = 0;
    if (passed && quest.xpReward > 0) {
      // The unique constraint behind claimXpAward is the real enforcement
      // point: only one concurrent passing submission can ever win this claim,
      // so XP can't be double-awarded regardless of how many retakes race here.
      const claimed = await this.quests.claimXpAward(input.userId, input.questId);
      if (claimed) {
        const event = await this.getTodayEvent.execute();
        xpAwarded = quest.xpReward * event.xpMultiplier;
        await this.users.awardXp(input.userId, xpAwarded);
      }
    }

    if (passed) {
      await this.evaluateBadges.execute(input.userId);
    }

    return { result, xpAwarded };
  }
}
