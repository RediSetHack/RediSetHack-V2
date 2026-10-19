import { BadgeAwardSummary } from "./badge-award-summary.entity.js";
import type { AccomplishmentCounts, InitialCompetencyBaseline } from "@repo/contracts";

export interface ProfileCharacter {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export class UserProfile {
  constructor(
    public readonly userId: string,
    public readonly character: ProfileCharacter | null,
    public readonly totalXp: number,
    public readonly level: number,
    public readonly badges: BadgeAwardSummary[],
    public readonly activity: ProfileDataActivity[],
    public readonly initialCompetencyBaseline: InitialCompetencyBaseline | null,
    public readonly accomplishments: AccomplishmentCounts,
    public readonly shareId: string | null,
  ) {}
}

export type ProfileDataActivity = { id: string; activityType: 'quest' | 'reading' | 'ctf'; activityId: number; occurredAt: Date; outcome: unknown };
