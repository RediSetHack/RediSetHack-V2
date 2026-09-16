import { StageCompletion } from '../../application/mark-stage-complete.use-case.js';

export class CompletedStagePresenter {
  static toResponse(completion: StageCompletion) {
    return {
      stageId: completion.stageId,
      xpEarned: completion.xpEarned,
      eventMultiplier: completion.eventMultiplier,
      eventType: completion.eventType,
      level: completion.level,
      leveledUp: completion.leveledUp,
      badgesEarned: completion.badgesEarned.map((award) => ({
        badgeDefinitionId: award.badge.id,
        name: award.badge.name,
        slug: award.badge.slug,
        imageUrl: award.badge.imageUrl,
        awardCount: award.awardCount,
      })),
      nextStageId: completion.nextStageId,
    };
  }
}
