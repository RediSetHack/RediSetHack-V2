import { BadgeAwardSummary } from "./badge-award-summary.entity.js";

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
  ) {}
}
