import { Injectable } from "@nestjs/common";

import { QuestResult } from "../domain/entities/quest-result.entity.js";
import { QuestResultNotFoundError } from "../domain/errors.js";
import { QuestRepository } from "../domain/ports/quest.repository.js";

export type AnswerBreakdownItem = {
  questionId: number;
  prompt: string;
  options: Array<{ id: number; text: string; isCorrect: boolean }>;
  chosenOptionId: number | null;
  isCorrect: boolean;
};

export type QuestResultReview = { result: QuestResult; breakdown: AnswerBreakdownItem[] };

@Injectable()
export class ViewQuestResultUseCase {
  constructor(private readonly quests: QuestRepository) {}

  async execute(resultId: number, userId: string): Promise<QuestResultReview> {
    const result = await this.quests.findResultById(resultId);
    // Not found and not-owned are indistinguishable to the requester,
    // avoiding an ID-enumeration oracle for other users' results.
    if (!result || result.userId !== userId) {
      throw new QuestResultNotFoundError(resultId);
    }

    const questions = await this.quests.findQuestions(result.questId);
    const chosenByQuestion = new Map(result.responses.map((r) => [r.questionId, r.optionId]));

    const breakdown = questions.map((question) => {
      const chosenOptionId = chosenByQuestion.get(question.id) ?? null;
      const correctOption = question.options.find((option) => option.isCorrect);
      return {
        questionId: question.id,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          isCorrect: option.isCorrect,
        })),
        chosenOptionId,
        isCorrect: chosenOptionId !== null && correctOption?.id === chosenOptionId,
      };
    });

    return { result, breakdown };
  }
}
