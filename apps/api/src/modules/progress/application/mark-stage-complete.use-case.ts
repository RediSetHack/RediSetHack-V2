import { Injectable } from "@nestjs/common";

import { StageRepository } from "../../content/domain/ports/stage.repository.js";
import { ProgressRepository } from "../domain/ports/progress.repository.js";
import { StageAlreadyCompletedError, StageLockedError, StageNotFoundError } from "../domain/errors.js";
import { GetTodayEventUseCase } from "../../daily-event/application/get-today-event.use-case.js";
import { getStageAccess, isUnlocked } from "./stage-access.js";

export type StageCompletion = {
  stageId: number;
  xpEarned: number;
  eventMultiplier: number;
  eventType: "normal" | "bonus";
};

@Injectable()
export class MarkStageCompleteUseCase {
  constructor(
    private readonly stages: StageRepository,
    private readonly progress: ProgressRepository,
    private readonly getTodayEvent: GetTodayEventUseCase,
  ) {}

  async execute(userId: string, stageId: number): Promise<StageCompletion> {
    const stage = await this.stages.findById(stageId);
    if (!stage) throw new StageNotFoundError(stageId);

    const access = await getStageAccess(this.stages, userId, stage);
    if (!isUnlocked(access)) throw new StageLockedError(stageId);
    if (access.completedIds.has(stage.id)) throw new StageAlreadyCompletedError(stageId);

    const event = await this.getTodayEvent.execute();
    const xpEarned = stage.xpReward * event.xpMultiplier;

    const awarded = await this.progress.markCompleted(userId, stage.id, xpEarned);
    if (!awarded) throw new StageAlreadyCompletedError(stageId);

    return {
      stageId: stage.id,
      xpEarned,
      eventMultiplier: event.xpMultiplier,
      eventType: event.eventType,
    };
  }
}