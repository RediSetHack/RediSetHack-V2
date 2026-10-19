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

    // When an activity filter (competency/difficulty) is active, only parents
    // that contain at least one matching stage may appear as entry points.
    // This keeps competency/difficulty from adding irrelevant parents that
    // would consume the bounded limit and starve matching activities.
    const hasActivityFilter = competency !== undefined || difficulty !== undefined;
    const matchingStageZoneIds = new Set<number>();
    const matchingStageRegionIds = new Set<number>();

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

        matchingStageZoneIds.add(zoneId);
        if (region) matchingStageRegionIds.add(region.id);

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

    // Regions appear as discovery entry points. A search query may match a
    // parent entry point, but competency/difficulty must not add irrelevant
    // parents: when an activity filter is active, only regions containing a
    // matching stage are included.
    const regionIncludes = (region: (typeof allRegions)[number]): boolean =>
      (!query || matchesSearch({ title: region.name, slug: region.slug }, query)) &&
      (!hasActivityFilter || matchingStageRegionIds.has(region.id));

    for (const region of allRegions) {
      if (!regionIncludes(region)) continue;
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

    // Zones appear as discovery entry points. Same relevance rules as regions.
    const zoneIncludes = (zone: (typeof allZones)[number]): boolean =>
      (!query || matchesSearch({ title: zone.name, slug: zone.slug }, query)) &&
      (!hasActivityFilter || matchingStageZoneIds.has(zone.id));

    for (const zone of allZones) {
      const region = regionById.get(zone.regionId);
      if (!zoneIncludes(zone)) continue;
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

    // Sort each kind by sortOrder then id. Reserve Stage slots first so parent
    // entry points cannot starve matching activities, then fill with Regions
    // and Zones in that order.
    const kindCap = Math.ceil(limit / 3);
    const byKind = new Map<DiscoveryItem['kind'], DiscoveryItem[]>([
      ['region', []],
      ['zone', []],
      ['stage', []],
    ]);
    for (const item of items) {
      byKind.get(item.kind)!.push(item);
    }

    const sortKind = (a: DiscoveryItem, b: DiscoveryItem): number => {
      const aOrder = a.sortOrder ?? 0;
      const bOrder = b.sortOrder ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.id - b.id;
    };

    const ordered: DiscoveryItem[] = [];
    // Stages (learning activities) are guaranteed their slots before parents.
    ordered.push(...byKind.get('stage')!.sort(sortKind).slice(0, kindCap));
    const remaining = Math.max(0, limit - ordered.length);
    const regionSlots = Math.ceil(remaining / 2);
    const regionItems = byKind.get('region')!.sort(sortKind).slice(0, regionSlots);
    // Parents fill the rest, regions then zones; use actual region count so
    // available zones are not left unused.
    ordered.push(...regionItems);
    ordered.push(
      ...byKind.get('zone')!.sort(sortKind).slice(0, remaining - regionItems.length),
    );

    return ordered.slice(0, limit);
  }
}
