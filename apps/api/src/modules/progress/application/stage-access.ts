import { Stage } from "../../content/domain/entities/stage.entity.js";
import type { StageRepository } from "../../content/domain/ports/stage.repository.js";

export type StageAccess = {
  sorted: Stage[];
  index: number;
  completedIds: ReadonlySet<number>;
};

// ponytail: stages are unlocked strictly sequentially within a zone
export async function getStageAccess(
  repo: StageRepository,
  userId: string,
  stage: Stage,
): Promise<StageAccess> {
  const [allStages, completedIds] = await Promise.all([
    repo.findByZoneId(stage.zoneId),
    repo.findCompletedStageIds(userId, stage.zoneId),
  ]);
  const sorted = [...allStages].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    sorted,
    index: sorted.findIndex((s) => s.id === stage.id),
    completedIds: new Set(completedIds),
  };
}

export function isUnlocked(access: StageAccess): boolean {
  if (access.index < 0) return false;
  if (access.index === 0) return true;
  const predecessor = access.sorted[access.index - 1];
  return predecessor !== undefined && access.completedIds.has(predecessor.id);
}