import { BadgeAwardSummary } from "../entities/badge-award-summary.entity.js";
import { ProfileCharacter } from "../entities/user-profile.entity.js";

export interface ProfileData {
  userId: string;
  totalXp: number;
  character: ProfileCharacter | null;
  badges: BadgeAwardSummary[];
}

export interface LeaderboardRow {
  userId: string;
  name: string | null;
  totalXp: number;
}

export abstract class ProfileRepository {
  abstract findProfileByUserId(userId: string): Promise<ProfileData | null>;
  abstract findLeaderboardPage(
    page: number,
    limit: number,
  ): Promise<{ rows: LeaderboardRow[]; total: number }>;
}
