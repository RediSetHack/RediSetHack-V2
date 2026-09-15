import { Stage } from './domain/entities/stage.entity.js';
import { StageRepository } from './domain/ports/stage.repository.js';

// Shared test double: every integration spec that drives Stage lookups off
// its own `stagesByZone`/`completedStageIds` maps needs the same fake, so it
// lives here instead of duplicated per spec file.
export function makeFakeStageRepository(
  stagesByZone: Map<number, Stage[]>,
  completedStageIds: Set<number>,
): StageRepository {
  return {
    async findById(stageId) {
      for (const stages of stagesByZone.values()) {
        const found = stages.find((s) => s.id === stageId);
        if (found) return found;
      }
      return null;
    },
    async findByZoneId(zoneId) {
      return stagesByZone.get(zoneId) ?? [];
    },
    async findCompletedStageIds(_userId, zoneId) {
      const stages = stagesByZone.get(zoneId) ?? [];
      return stages.filter((s) => completedStageIds.has(s.id)).map((s) => s.id);
    },
  };
}
