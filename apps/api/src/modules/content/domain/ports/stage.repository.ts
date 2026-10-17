import { Stage } from '../entities/stage.entity.js';

export abstract class StageRepository {
  abstract findById(stageId: number): Promise<Stage | null>;
  abstract findByZoneId(zoneId: number): Promise<Stage[]>;
  abstract hasArchivedAncestor(stageId: number): Promise<boolean>;
  abstract findCompletedStageIds(
    userId: string,
    zoneId: number,
  ): Promise<number[]>;
}
