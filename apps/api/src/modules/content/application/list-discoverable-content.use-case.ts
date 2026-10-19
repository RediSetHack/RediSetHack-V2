import { Injectable } from '@nestjs/common';

import { RegionRepository } from '../domain/ports/region.repository.js';
import { ZoneRepository } from '../domain/ports/zone.repository.js';
import { StageRepository, DiscoverableStage } from '../domain/ports/stage.repository.js';
import { Region } from '../domain/entities/region.entity.js';
import { Zone } from '../domain/entities/zone.entity.js';
import { isUnlocked } from '../../progress/application/stage-access.js';
import {
  type DiscoveryItem,
  DISCOVERY_DEFAULT_LIMIT,
  DISCOVERY_MAX_LIMIT,
  resolveCompetencies,
} from '@repo/contracts';

export type DiscoverableContentOptions = Readonly<{
  q?: string;
  competency?: string;
  difficulty?: string;
  limit?: number;
}>;

type DiscoveryFilters = Readonly<{
  query: string;
  competency: string | undefined;
  difficulty: string | undefined;
}>;

function clampLimit(limit: number | undefined): number {
  const value = limit ?? DISCOVERY_DEFAULT_LIMIT;
  return Math.min(Math.max(value, 1), DISCOVERY_MAX_LIMIT);
}

function matchesSearch(item: { title: string; slug: string }, query: string): boolean {
  const needle = query.toLowerCase();
  return item.title.toLowerCase().includes(needle) || item.slug.toLowerCase().includes(needle);
}

function stageStatus(
  unlocked: boolean,
  completedIds: ReadonlySet<number>,
  stageId: number,
): 'locked' | 'available' | 'completed' {
  if (!unlocked) return 'locked';
  return completedIds.has(stageId) ? 'completed' : 'available';
}

function buildStageItems(
  allStages: DiscoverableStage[],
  zoneById: Map<number, Zone>,
  regionById: Map<number, Region>,
  completedSet: Set<number>,
  filters: DiscoveryFilters,
): {
  stageItems: DiscoveryItem[];
  matchingStageZoneIds: Set<number>;
  matchingStageRegionIds: Set<number>;
} {
  const matchingStageZoneIds = new Set<number>();
  const matchingStageRegionIds = new Set<number>();
  const stageItems: DiscoveryItem[] = [];

  // Group stages by Zone so sequential unlock status is computed per Zone.
  const stagesByZone = new Map<number, DiscoverableStage[]>();
  for (const stage of allStages) {
    const list = stagesByZone.get(stage.zoneId);
    if (list) list.push(stage);
    else stagesByZone.set(stage.zoneId, [stage]);
  }

  for (const [zoneId, zoneStages] of stagesByZone) {
    const zone = zoneById.get(zoneId);
    const region = zone ? regionById.get(zone.regionId) : undefined;
    const zoneName = zone?.name ?? null;
    const regionName = region?.name ?? null;

    // Stable ordering: equal sortOrder stages tie-break by id so stage access
    // (sequential unlock) is deterministic regardless of input order.
    const sorted = [...zoneStages].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    for (const [index, stage] of sorted.entries()) {
      const unlocked = isUnlocked({ sorted, index, completedIds: completedSet });
      const status = stageStatus(unlocked, completedSet, stage.id);
      const lockReason = unlocked ? null : 'Complete the predecessor Stage first.';

      const competencies = resolveCompetencies(stage.competencyIds);

      // Competency and difficulty filters apply to activities (Stages).
      if (filters.competency && !competencies.some(({ id }) => id === filters.competency)) {
        continue;
      }
      if (filters.difficulty && stage.difficulty !== filters.difficulty) {
        continue;
      }
      if (filters.query && !matchesSearch({ title: stage.title, slug: stage.slug }, filters.query)) {
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

  return { stageItems, matchingStageZoneIds, matchingStageRegionIds };
}

function addRegions(
  items: DiscoveryItem[],
  allRegions: Region[],
  query: string,
  hasActivityFilter: boolean,
  matchingStageRegionIds: Set<number>,
): void {
  const regionIncludes = (region: Region): boolean => {
    const textMatch =
      !query || matchesSearch({ title: region.name, slug: region.slug }, query);
    const activityOK = !hasActivityFilter || matchingStageRegionIds.has(region.id);
    // A query match on a child Stage pulls in its parent Region as an entry
    // point even when the Region's own text does not match the query.
    const queryAncestor = !!query && matchingStageRegionIds.has(region.id);
    return activityOK && (textMatch || queryAncestor);
  };

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
}

function addZones(
  items: DiscoveryItem[],
  allZones: Zone[],
  regionById: Map<number, Region>,
  query: string,
  hasActivityFilter: boolean,
  matchingStageZoneIds: Set<number>,
): void {
  const zoneIncludes = (zone: Zone): boolean => {
    const textMatch = !query || matchesSearch({ title: zone.name, slug: zone.slug }, query);
    const activityOK = !hasActivityFilter || matchingStageZoneIds.has(zone.id);
    // A query match on a child Stage pulls in its parent Zone as an entry
    // point even when the Zone's own text does not match the query.
    const queryAncestor = !!query && matchingStageZoneIds.has(zone.id);
    return activityOK && (textMatch || queryAncestor);
  };

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
}

function sortKind(a: DiscoveryItem, b: DiscoveryItem): number {
  const aOrder = a.sortOrder ?? 0;
  const bOrder = b.sortOrder ?? 0;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return a.id - b.id;
}

function sortAndCap(items: DiscoveryItem[], limit: number): DiscoveryItem[] {
  const kindCap = Math.ceil(limit / 3);
  const byKind = new Map<DiscoveryItem['kind'], DiscoveryItem[]>([
    ['region', []],
    ['zone', []],
    ['stage', []],
  ]);
  for (const item of items) {
    byKind.get(item.kind)!.push(item);
  }

  const ordered: DiscoveryItem[] = [];
  // Stages (learning activities) are guaranteed their slots before parents.
  ordered.push(...byKind.get('stage')!.sort(sortKind).slice(0, kindCap));
  const remaining = Math.max(0, limit - ordered.length);
  const regionSlots = Math.ceil(remaining / 2);
  const regionItems = byKind.get('region')!.sort(sortKind).slice(0, regionSlots);
  // Parents fill the rest, regions then zones; use actual region count so
  // available zones are not left unused.
  ordered.push(...regionItems);
  ordered.push(...byKind.get('zone')!.sort(sortKind).slice(0, remaining - regionItems.length));

  return ordered.slice(0, limit);
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
    const filters: DiscoveryFilters = {
      query: (options.q ?? '').trim().toLowerCase(),
      competency: options.competency,
      difficulty: options.difficulty,
    };

    const [allRegions, allZones, allStages, completedIds] = await Promise.all([
      this.regions.findAll(),
      this.zones.findAll(),
      this.stages.findAllDiscoverable(),
      this.stages.findAllCompletedStageIds(userId),
    ]);

    const regionById = new Map(allRegions.map((r) => [r.id, r]));
    const zoneById = new Map(allZones.map((z) => [z.id, z]));
    const completedSet = new Set(completedIds);

    const hasActivityFilter = filters.competency !== undefined || filters.difficulty !== undefined;

    const { stageItems, matchingStageZoneIds, matchingStageRegionIds } = buildStageItems(
      allStages,
      zoneById,
      regionById,
      completedSet,
      filters,
    );

    const items: DiscoveryItem[] = [];
    addRegions(items, allRegions, filters.query, hasActivityFilter, matchingStageRegionIds);
    addZones(items, allZones, regionById, filters.query, hasActivityFilter, matchingStageZoneIds);
    items.push(...stageItems);

    return sortAndCap(items, limit);
  }
}
