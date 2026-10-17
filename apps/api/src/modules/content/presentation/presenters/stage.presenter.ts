import { StageWithStatus } from '../../application/list-stages.use-case.js';
import { resolveCompetencies } from '@repo/contracts';

export class StagePresenter {
  static toResponse(stage: StageWithStatus) {
    return {
      id: stage.id,
      zoneId: stage.zoneId,
      title: stage.title,
      slug: stage.slug,
      lessonContent: stage.lessonContent,
      competencies: resolveCompetencies(stage.competencyIds),
      difficulty: stage.difficulty,
      xpReward: stage.xpReward,
      sortOrder: stage.sortOrder,
      status: stage.status,
      lockReason: stage.lockReason,
    };
  }
}
