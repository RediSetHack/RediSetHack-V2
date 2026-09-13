import { Injectable } from "@nestjs/common";

import { StageRepository } from "../../content/domain/ports/stage.repository.js";
import { StageLockedError, StageNotFoundError } from "../domain/errors.js";
import type { LessonBlock } from "../domain/entities/lesson.entity.js";
import { getStageAccess, isUnlocked } from "./stage-access.js";

export type StageLesson = {
  id: number;
  zoneId: number;
  title: string;
  slug: string;
  xpReward: number;
  sortOrder: number;
  status: "available" | "completed";
  blocks: LessonBlock[];
};

function parseLessonBlocks(raw: string | null): LessonBlock[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as LessonBlock[]) : [];
}

@Injectable()
export class GetStageLessonUseCase {
  constructor(private readonly stages: StageRepository) {}

  async execute(userId: string, stageId: number): Promise<StageLesson> {
    const stage = await this.stages.findById(stageId);
    if (!stage) throw new StageNotFoundError(stageId);

    const access = await getStageAccess(this.stages, userId, stage);
    if (!isUnlocked(access)) throw new StageLockedError(stageId);

    return {
      id: stage.id,
      zoneId: stage.zoneId,
      title: stage.title,
      slug: stage.slug,
      xpReward: stage.xpReward,
      sortOrder: stage.sortOrder,
      status: access.completedIds.has(stage.id) ? "completed" : "available",
      blocks: parseLessonBlocks(stage.lessonContent),
    };
  }
}