import { Injectable } from "@nestjs/common";

import { Quest, QuestQuestion } from "../domain/entities/quest.entity.js";
import { QuestNotFoundError } from "../domain/errors.js";
import { QuestRepository } from "../domain/ports/quest.repository.js";

export type QuestSession = { quest: Quest; questions: QuestQuestion[] };

@Injectable()
export class StartQuestUseCase {
  constructor(private readonly quests: QuestRepository) {}

  async execute(questId: number): Promise<QuestSession> {
    const quest = await this.quests.findById(questId);
    if (!quest) {
      throw new QuestNotFoundError(questId);
    }
    const questions = await this.quests.findQuestions(questId);
    return { quest, questions };
  }
}
