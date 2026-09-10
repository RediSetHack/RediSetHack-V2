import { StageWithStatus } from "../../application/list-stages.use-case.js";

export class StagePresenter {
  static toResponse(stage: StageWithStatus) {
    return {
      id: stage.id,
      zoneId: stage.zoneId,
      title: stage.title,
      slug: stage.slug,
      lessonContent: stage.lessonContent,
      xpReward: stage.xpReward,
      sortOrder: stage.sortOrder,
      status: stage.status,
    };
  }
}
