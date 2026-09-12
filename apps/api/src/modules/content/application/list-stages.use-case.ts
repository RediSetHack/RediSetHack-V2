import { Injectable } from "@nestjs/common";

import { StageRepository } from "../domain/ports/stage.repository.js";
import { Stage, StageStatus } from "../domain/entities/stage.entity.js";

export type StageWithStatus = Stage & { status: StageStatus };

@Injectable()
export class ListStagesUseCase {
  constructor(private readonly stages: StageRepository) {}

  async execute(userId: string, zoneId: number): Promise<StageWithStatus[]> {
    const [allStages, completedIds] = await Promise.all([
      this.stages.findByZoneId(zoneId),
      this.stages.findCompletedStageIds(userId, zoneId),
    ]);

    const completedSet = new Set(completedIds);

    const sorted = [...allStages].sort((a, b) => a.sortOrder - b.sortOrder);

    return sorted.map((stage, index) => {
      let status: StageStatus;

      if (completedSet.has(stage.id)) {
        status = "completed";
      } else if (index === 0) {
        status = "available";
      } else {
        const prevStage = sorted[index - 1]!;
        status = completedSet.has(prevStage.id) ? "available" : "locked";
      }

      return { ...stage, status };
    });
  }
}
