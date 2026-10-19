import { Injectable } from '@nestjs/common';

import { RegionRepository } from '../domain/ports/region.repository.js';
import { ZoneRepository } from '../domain/ports/zone.repository.js';
import { StageRepository } from '../domain/ports/stage.repository.js';
import { isUnlocked } from '../../progress/application/stage-access.js';
import { resolveCompetencies } from '@repo/contracts';
import {
  DiscoveryItem,
  DISCOVERY_DEFAULT_LIMIT,
  DISCOVERY_MAX_LIMIT,
} from '@repo/contracts';

export type DiscoverableContentOptions = Readonly<{
  q?: string;
  competency?: string;
  difficulty?: string;
  limit?: number;
}>;

function clampLimit(limit: number | undefined): number {
  const value = limit ?? DISCOVERY_DEFAULT_LIMIT;
  return Math.min(Math.max(value, 1), DISCOVERY_MAX_LIMIT);
}

function matchesSearch(item: { title: string; slug: string }, query: string): boolean {
  const needle = query.toLowerCase();
  return item.title.toLowerCase().includes(needle) || item.slug.toLowerCase().includes(needle);
}

@Injectable()
export class ListDiscoverableContentUseCase {
  constructor(
    private readonly regions: RegionRepository,
    private readonly zones: ZoneRepository,
    private readonly stages: StageRepository,
  ) {}

  async execute(
    userId: string,
    options: DiscoverableContentOptions,
  ): Promise<DiscoveryItem[]> {
    const limit = clampLimit(options.limit);
    const query = (options.q ?? '').trim().toLowerCase();
    const competency = options.competency;
    const difficulty = options.difficulty;

    const [allRegions, allZones, allStages, completedIds] = await Promise.all([
      this.regions.findAll(),
      this.zones.findAll(),
      this.stages.findAllDiscoverable(),
      this.stages.findAllCompletedStageIds(userId),
    ]);

    const regionById = new Map(allRegions.map((r) => [r.id, r]));
    const zoneById = new Map(allZones.map((z) => [z.id, z]));

    const completedSet = new Set(completedIds);

    // Group stages by Zone so sequential unlock status is computed per Zone.
    const stagesByZone = new Map<number, typeof allStages>();
    for (const stage of allStages) {
      const list = stagesByZone.get(stage.zoneId);
      if (list) list.push(stage);
      else stagesByZone.set(stage.zoneId, [stage]);
    }

    const stageItems: DiscoveryItem[] = [];
    for (const [zoneId, zoneStages] of stagesByZone) {
      const zone = zoneById.get(zoneId);
      const region = zone ? regionById.get(zone.regionId) : undefined;
      const zoneName = zone?.name ?? null;
      const regionName = region?.name ?? null;

      const sorted = [...zoneStages].sort((a, b) => a.sortOrder - b.sortOrder);
      for (const [index, stage] of sorted.entries()) {
        const unlocked = isUnlocked({
          sorted,
          index,
          completedIds: completedSet,
        });
        const status: 'locked' | 'available' | 'completed' = !unlocked
          ? 'locked'
          : completedSet.has(stage.id)
            ? 'completed'
            : 'available';
        const lockReason = unlocked ? null : 'Complete the predecessor Stage first.';

        const competencies = resolveCompetencies(stage.competencyIds);

        // Competency and difficulty filters apply to activities (Stages).
        if (competency && !competencies.some(({ id }) => id === competency)) {
          continue;
        }
        if (difficulty && stage.difficulty !== difficulty) {
          continue;
        }
        if (query && !matchesSearch({ title: stage.title, slug: stage.slug }, query)) {
          continue;
        }

        stageItems.push({
          kind: 'stage',
          id: stage.id,
          title: stage.title,
          slug: stage.slug,
          description: null,
          regionId: stage.regionId,
          regionName,
          zoneId: stage.zoneId,
          zoneName,
          competencies,
          difficulty: stage.difficulty,
          xpReward: stage.xpReward,
          sortOrder: stage.sortOrder,
          status,
          lockReason,
        });
      }
    }

    const items: DiscoveryItem[] = [];

    // Regions (Novels) appear as discovery entry points, subject to search.
    for (const region of allRegions) {
      if (query && !matchesSearch({ title: region.name, slug: region.slug }, query)) {
        continue;
      }
      items.push({
        kind: 'region',
        id: region.id,
        title: region.name,
        slug: region.slug,
        description: region.description,
        storyIntro: region.storyIntro,
        sortOrder: region.sortOrder,
      });
    }

    // Zones (chapters) appear as discovery entry points, subject to search.
    for (const zone of allZones) {
      const region = regionById.get(zone.regionId);
      if (query && !matchesSearch({ title: zone.name, slug: zone.slug }, query)) {
        continue;
      }
      items.push({
        kind: 'zone',
        id: zone.id,
        title: zone.name,
        slug: zone.slug,
        description: zone.description,
        regionId: zone.regionId,
        regionName: region?.name ?? undefined,
        sortOrder: zone.sortOrder,
      });
    }

    // Stages (learning activities) appear last, already filtered above.
    items.push(...stageItems);

    // Stable, bounded ordering: regions, then zones, then stages, each by sortOrder.
    items.sort((a, b) => {
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.id - b.id;
    });

    return items.slice(0, limit);
  }
}
