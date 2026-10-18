import { Injectable } from '@nestjs/common';

import { StageRepository } from '../../content/domain/ports/stage.repository.js';
import { normalizeLessonContent } from '../../content/domain/normalize-lesson-content.js';
import { StageLockedError, StageNotFoundError } from '../domain/errors.js';
import { resolveCompetencies } from '@repo/contracts';
import type { LessonBlock } from '../domain/entities/lesson.entity.js';
import { getStageAccess, isUnlocked } from './stage-access.js';
import { ProgressRepository } from '../domain/ports/progress.repository.js';

export type StageLesson = {
  id: number;
  zoneId: number;
  title: string;
  slug: string;
  xpReward: number;
  sortOrder: number;
  competencies: ReturnType<typeof resolveCompetencies>;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  status: 'available' | 'completed';
  blocks: LessonBlock[];
};

function parseLessonBlocks(raw: unknown): LessonBlock[] {
  const normalized = normalizeLessonContent(raw);
  return Array.isArray(normalized) ? (normalized as LessonBlock[]) : [];
}

@Injectable()
export class GetStageLessonUseCase {
  constructor(private readonly stages: StageRepository, private readonly progress: ProgressRepository) {}

  async execute(userId: string, stageId: number): Promise<StageLesson> {
    const stage = await this.stages.findById(stageId);
    if (!stage) throw new StageNotFoundError(stageId);

    const access = await getStageAccess(this.stages, userId, stage);
    if (!isUnlocked(access)) throw new StageLockedError(stageId);
    if (!access.completedIds.has(stage.id)) await this.progress.startReadingSession(userId, stage.id);

    return {
      id: stage.id,
      zoneId: stage.zoneId,
      title: stage.title,
      slug: stage.slug,
      xpReward: stage.xpReward,
      sortOrder: stage.sortOrder,
      competencies: resolveCompetencies(stage.competencyIds),
      difficulty: stage.difficulty,
      status: access.completedIds.has(stage.id) ? 'completed' : 'available',
      blocks: parseLessonBlocks(stage.lessonContent),
    };
  }
}
