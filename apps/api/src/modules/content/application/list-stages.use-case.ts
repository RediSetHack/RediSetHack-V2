import { Injectable } from '@nestjs/common';

import { StageRepository } from '../domain/ports/stage.repository.js';
import { isUnlocked } from '../../progress/application/stage-access.js';
import { StageLockedError } from '../../progress/domain/errors.js';
import { Stage, StageStatus } from '../domain/entities/stage.entity.js';

export type StageWithStatus = Stage & {
  status: StageStatus;
  lockReason: string | null;
};

@Injectable()
export class ListStagesUseCase {
  constructor(private readonly stages: StageRepository) {}

  async execute(userId: string, zoneId: number): Promise<StageWithStatus[]> {
    const [allStages, completedIds] = await Promise.all([
      this.stages.findByZoneId(zoneId),
      this.stages.findCompletedStageIds(userId, zoneId),
    ]);

    const completedSet = new Set(completedIds);

    const sorted = [...allStages].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

    return sorted.map((stage, index) => {
      const unlocked = isUnlocked({
        sorted,
        index,
        completedIds: completedSet,
      });
      const status: StageStatus = !unlocked
        ? 'locked'
        : completedSet.has(stage.id)
          ? 'completed'
          : 'available';
      return {
        ...stage,
        lessonContent: unlocked ? stage.lessonContent : undefined,
        status,
        lockReason: unlocked ? null : new StageLockedError(stage.id).message,
      };
    });
  }
}
