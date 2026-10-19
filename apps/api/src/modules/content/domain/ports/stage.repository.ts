import { Stage } from '../entities/stage.entity.js';

export type DiscoverableStage = Stage & {
  regionId: number;
};

export abstract class StageRepository {
  abstract findById(stageId: number): Promise<Stage | null>;
  abstract findByZoneId(zoneId: number): Promise<Stage[]>;
  abstract hasArchivedAncestor(stageId: number): Promise<boolean>;
  abstract findCompletedStageIds(
    userId: string,
    zoneId: number,
  ): Promise<number[]>;
  /** Every non-archived Stage whose Zone and Region ancestors are also
   *  non-archived, ordered for discovery listing. */
  abstract findAllDiscoverable(): Promise<DiscoverableStage[]>;
  /** Every Stage the learner has completed, across all Zones. */
  abstract findAllCompletedStageIds(userId: string): Promise<number[]>;
}
