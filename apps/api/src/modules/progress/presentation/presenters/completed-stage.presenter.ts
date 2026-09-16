import { StageCompletion } from "../../application/mark-stage-complete.use-case.js";
import { toBadgeAwardsPresenter } from "../../../badge/presentation/presenters/badge-award.presenter.js";

export class CompletedStagePresenter {
  static toResponse(completion: StageCompletion) {
    return {
      stageId: completion.stageId,
      xpEarned: completion.xpEarned,
      eventMultiplier: completion.eventMultiplier,
      eventType: completion.eventType,
      level: completion.level,
      leveledUp: completion.leveledUp,
      badgesEarned: toBadgeAwardsPresenter(completion.badgesEarned),
    };
  }
}