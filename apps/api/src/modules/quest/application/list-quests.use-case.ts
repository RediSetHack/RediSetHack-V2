import { StageRepository } from '../../content/domain/ports/stage.repository.js';
import { assertStageAccess } from '../../progress/application/stage-access.js';
import {
  StageLockedError,
  StageNotFoundError,
} from '../../progress/domain/errors.js';
import { Injectable } from '@nestjs/common';

import { Quest } from '../domain/entities/quest.entity.js';
import { QuestRepository } from '../domain/ports/quest.repository.js';

export type QuestWithStatus = {
  quest: Quest;
  completed: boolean;
  lockReason: string | null;
};

@Injectable()
export class ListQuestsUseCase {
  constructor(
    private readonly quests: QuestRepository,
    private readonly stages: StageRepository,
  ) {}

  async execute(userId: string): Promise<QuestWithStatus[]> {
    const [all, passedIds] = await Promise.all([
      this.quests.findAll(),
      this.quests.findPassedQuestIds(userId),
    ]);
    return Promise.all(
      all.map(async (quest) => {
        let lockReason: string | null = null;
        try {
          await assertStageAccess(this.stages, userId, quest.stageId);
        } catch (error) {
          if (!(
            error instanceof StageLockedError ||
            error instanceof StageNotFoundError
          ))
            throw error;
          lockReason = error.message;
        }
        return { quest, completed: passedIds.has(quest.id), lockReason };
      }),
    );
  }
}
