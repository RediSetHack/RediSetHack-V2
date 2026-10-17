import { StageRepository } from '../../content/domain/ports/stage.repository.js';
import { assertStageAccess } from '../../progress/application/stage-access.js';

import { Injectable } from '@nestjs/common';

import { Quest } from '../domain/entities/quest.entity.js';
import { QuestSession } from '../domain/entities/quest-session.entity.js';
import { QuestNotFoundError } from '../domain/errors.js';
import { QuestRepository } from '../domain/ports/quest.repository.js';

export type StartedQuestSession = { quest: Quest; session: QuestSession };

@Injectable()
export class StartQuestUseCase {
  constructor(
    private readonly quests: QuestRepository,
    private readonly stages: StageRepository,
  ) {}

  // Resumes the learner's unexpired session for this Quest, otherwise starts
  // a new one: a retake is simply starting again once the last session is
  // submitted or expired. The deadline is fixed at start by the server clock.
  async execute(userId: string, questId: number): Promise<StartedQuestSession> {
    const quest = await this.quests.findById(questId);
    if (!quest) {
      throw new QuestNotFoundError(questId);
    }
    if (quest.archivedAt) throw new QuestNotFoundError(questId);

    await assertStageAccess(this.stages, userId, quest.stageId);
    if ((await this.stages.findById(quest.stageId))?.archivedAt) {
      throw new QuestNotFoundError(questId);
    }

    const active = await this.quests.findActiveSession(userId, questId);
    if (active) {
      if (active.expiresAt.getTime() > Date.now()) {
        return { quest, session: active };
      }
      // Abandoned past its deadline: close it with no credit so the new
      // session can take its place.
      await this.quests.finalizeSession({
        sessionId: active.id,
        status: 'expired',
        score: 0,
        passed: false,
        responses: [],
      });
    }

    const questions = await this.quests.findQuestions(questId);
    const session = await this.quests.createSession({
      userId,
      questId,
      questions,
      passingScore: quest.passingScore,
      expiresAt: new Date(Date.now() + quest.timeLimitSeconds * 1000),
    });
    return { quest, session };
  }
}
