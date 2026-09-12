// Data-driven criteria per ADR 0003 (docs/adr/0003-badge-multiplicity.md):
// cumulative and activity badges repeat every `threshold` count crossed
// (e.g. "×3"); category badges award once when the target zone is fully
// completed.
export type BadgeCriteria =
  | { trigger: 'cumulative'; target: 'stage_completions'; threshold: number }
  | { trigger: 'activity'; target: 'quest_passes'; threshold: number }
  | { trigger: 'category'; target: 'zone_completion'; zoneId: number };

export class BadgeDefinition {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly criteria: BadgeCriteria,
    public readonly imageUrl: string | null,
  ) {}
}

export type EarnedBadge = {
  badge: BadgeDefinition;
  count: number;
  awardedAt: Date[];
};
