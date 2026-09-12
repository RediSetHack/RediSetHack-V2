import { StageLesson } from "../../application/get-stage-lesson.use-case.js";

export class LessonPresenter {
  static toResponse(lesson: StageLesson) {
    return {
      id: lesson.id,
      zoneId: lesson.zoneId,
      title: lesson.title,
      slug: lesson.slug,
      xpReward: lesson.xpReward,
      sortOrder: lesson.sortOrder,
      status: lesson.status,
      blocks: lesson.blocks,
    };
  }
}