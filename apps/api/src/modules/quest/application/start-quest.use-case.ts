import { Injectable } from '@nestjs/common';

import { Quest, QuestQuestion } from '../domain/entities/quest.entity.js';
import { QuestNotFoundError } from '../domain/errors.js';
import { QuestRepository } from '../domain/ports/quest.repository.js';

export type QuestSession = {
  quest: Quest;
  questions: QuestQuestion[];
  expiresAt: Date;
};

@Injectable()
export class StartQuestUseCase {
  constructor(private readonly quests: QuestRepository) {}

  async execute(questId: number): Promise<QuestSession> {
    const quest = await this.quests.findById(questId);
    if (!quest) {
      throw new QuestNotFoundError(questId);
    }
    const questions = await this.quests.findQuestions(questId);
    // ponytail: the deadline is computed, not persisted — nothing stops a
    // learner from calling submit after it passes, since the server trusts
    // the client's countdown. Upgrade to a persisted Quest Session row (with
    // submit checking elapsed time server-side) if timer-tampering matters.
    const expiresAt = new Date(Date.now() + quest.timeLimitSeconds * 1000);
    return { quest, questions, expiresAt };
  }
}
