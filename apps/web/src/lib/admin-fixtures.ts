import type { BadgeDefinition, Character, Quest, Region, Stage, Zone } from "@/lib/api-client";

/**
 * Fixtures for the admin catalog rows, shared by the admin specs so each one
 * describes its own case instead of repeating the same builders.
 */

export function region(id: number, name: string, sortOrder = 0): Region {
  return { id, name, slug: name.toLowerCase(), description: null, sortOrder, storyIntro: null };
}

export function zone(id: number, regionId: number, name: string, sortOrder = 0): Zone {
  return { id, regionId, name, slug: name.toLowerCase(), description: null, sortOrder };
}

export function stage(id: number, zoneId: number, title: string, sortOrder = 0, xpReward = 10): Stage {
  return { id, zoneId, title, slug: title.toLowerCase(), xpReward, sortOrder, status: "available", lockReason: null };
}

export function quest(id: number, stageId: number, title: string, xpReward = 5): Quest {
  return {
    id,
    stageId,
    title,
    description: null,
    timeLimitSeconds: 60,
    passingScore: 70,
    xpReward,
    initialAssessment: false,
    completed: false,
    lockReason: null,
  };
}

export function badge(id: number): BadgeDefinition {
  return {
    id,
    name: `Badge ${id}`,
    slug: `badge-${id}`,
    description: null,
    criteria: { trigger: "cumulative", target: "stage_completions", threshold: id },
    imageUrl: null,
  };
}

export function character(id: number): Character {
  return { id, name: `Character ${id}`, slug: `character-${id}`, description: null, imageUrl: null };
}
