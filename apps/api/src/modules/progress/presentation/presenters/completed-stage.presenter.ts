import { StageCompletion } from "../../application/mark-stage-complete.use-case.js";

export class CompletedStagePresenter {
  static toResponse(completion: StageCompletion) {
    return {
      stageId: completion.stageId,
      xpEarned: completion.xpEarned,
      eventMultiplier: completion.eventMultiplier,
      eventType: completion.eventType,
    };
  }
}