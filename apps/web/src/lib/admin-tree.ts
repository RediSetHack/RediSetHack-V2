import type { Quest, Region, Stage, Zone } from "@/lib/api-client";

/** The four levels of the admin content tree, per PAGES.md §15.2. */
export type ContentKind = "region" | "zone" | "stage" | "quest";

export type ContentNode = Readonly<{
  id: number;
  kind: ContentKind;
  name: string;
  /** The node's Edit link inside the Control Panel. */
  editHref: string;
  /** A Stage's XP reward; `null` for every other kind. */
  xpReward: number | null;
  children: readonly ContentNode[];
}>;

/** The whole content tree, rooted at the Regions. */
export type ContentTree = Readonly<{ regions: readonly ContentNode[] }>;

/** The catalog rows the tree is built from. */
export type ContentCatalog = Readonly<{
  regions: readonly Region[];
  zones: readonly Zone[];
  stages: readonly Stage[];
  quests: readonly Quest[];
}>;

/** The six counts the dashboard's stat tiles show. */
export type CatalogCounts = Readonly<{
  regions: number;
  zones: number;
  stages: number;
  quests: number;
  badges: number;
  characters: number;
}>;

const EDIT_HREF: Record<ContentKind, (id: number) => string> = {
  region: (id) => `/admin/regions/${id}`,
  zone: (id) => `/admin/zones/${id}`,
  stage: (id) => `/admin/stages/${id}`,
  quest: (id) => `/admin/quests/${id}`,
};

function node(
  kind: ContentKind,
  id: number,
  name: string,
  xpReward: number | null,
  children: readonly ContentNode[],
): ContentNode {
  return { id, kind, name, editHref: EDIT_HREF[kind](id), xpReward, children };
}

function groupBy<T>(items: readonly T[], key: (item: T) => number): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const bucket = groups.get(key(item));
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key(item), [item]);
    }
  }
  return groups;
}

function bySortOrder(a: { id: number; sortOrder: number }, b: { id: number; sortOrder: number }): number {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}

function byTitle(a: { id: number; title: string }, b: { id: number; title: string }): number {
  return a.title.localeCompare(b.title) || a.id - b.id;
}

function questNode(quest: Quest): ContentNode {
  return node("quest", quest.id, quest.title, null, []);
}

function stageNode(stage: Stage, quests: readonly Quest[]): ContentNode {
  const children = [...quests].sort(byTitle).map(questNode);
  return node("stage", stage.id, stage.title, stage.xpReward, children);
}

function zoneNode(zone: Zone, stages: readonly Stage[], questsByStage: Map<number, Quest[]>): ContentNode {
  const children = [...stages]
    .sort(bySortOrder)
    .map((stage) => stageNode(stage, questsByStage.get(stage.id) ?? []));
  return node("zone", zone.id, zone.name, null, children);
}

function regionNode(region: Region, zones: readonly Zone[], stagesByZone: Map<number, Stage[]>, questsByStage: Map<number, Quest[]>): ContentNode {
  const children = [...zones]
    .sort(bySortOrder)
    .map((zone) => zoneNode(zone, stagesByZone.get(zone.id) ?? [], questsByStage));
  return node("region", region.id, region.name, null, children);
}

/**
 * Builds the collapsible Region › Zone › Stage › Quest outline the dashboard
 * shows. Every node carries its Edit link, so the tree doubles as the way
 * into each resource's Edit form.
 */
export function buildContentTree(catalog: ContentCatalog): ContentTree {
  const zonesByRegion = groupBy(catalog.zones, (zone) => zone.regionId);
  const stagesByZone = groupBy(catalog.stages, (stage) => stage.zoneId);
  const questsByStage = groupBy(catalog.quests, (quest) => quest.stageId);

  const regions = [...catalog.regions]
    .sort(bySortOrder)
    .map((region) => regionNode(region, zonesByRegion.get(region.id) ?? [], stagesByZone, questsByStage));

  return { regions };
}

/**
 * Counts the catalog rows behind each stat tile. The numbers come from the
 * very listings the tiles link to, so a tile can never disagree with the
 * list it opens.
 */
export function countCatalog(catalog: {
  regions: readonly unknown[];
  zones: readonly unknown[];
  stages: readonly unknown[];
  quests: readonly unknown[];
  badges: readonly unknown[];
  characters: readonly unknown[];
}): CatalogCounts {
  return {
    regions: catalog.regions.length,
    zones: catalog.zones.length,
    stages: catalog.stages.length,
    quests: catalog.quests.length,
    badges: catalog.badges.length,
    characters: catalog.characters.length,
  };
}
