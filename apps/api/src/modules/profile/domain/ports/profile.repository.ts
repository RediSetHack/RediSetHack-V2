import { BadgeAwardSummary } from "../entities/badge-award-summary.entity.js";
import { ProfileCharacter } from "../entities/user-profile.entity.js";
import type { AccomplishmentCounts, InitialCompetencyBaseline, LearningDay } from "@repo/contracts";

export interface ProfileData {
  userId: string;
  totalXp: number;
  character: ProfileCharacter | null;
  badges: BadgeAwardSummary[];
  activity: { id: string; activityType: 'quest' | 'reading' | 'ctf'; activityId: number; occurredAt: Date; outcome: unknown }[];
  initialCompetencyBaseline: InitialCompetencyBaseline | null;
  accomplishments: AccomplishmentCounts;
  shareId: string | null;
}

export interface LeaderboardRow {
  userId: string;
  name: string | null;
  totalXp: number;
}

export interface LeaderboardStanding {
  rank: number;
  totalXp: number;
}

export abstract class ProfileRepository {
  abstract findProfileByUserId(userId: string): Promise<ProfileData | null>;
  /** Owner of the profile currently shared under `shareId`; null once revoked or if never issued. */
  abstract findUserIdByShareId(shareId: string): Promise<string | null>;
  /** Issues a share id (keeping an existing one) or, when `enabled` is false, revokes it. Returns the resulting id. */
  abstract setSharing(userId: string, enabled: boolean): Promise<string | null>;
  /** Qualifying accomplishments per Asia/Manila day over the learner's whole history (active days only). */
  abstract findDailyLearningActivity(userId: string): Promise<LearningDay[]>;
  /**
   * Rank under the leaderboard order (`total_xp DESC, id ASC`, so ties are broken by id);
   * null for an unknown user or one with no XP.
   */
  abstract findLeaderboardStanding(userId: string): Promise<LeaderboardStanding | null>;
  abstract findLeaderboardPage(
    page: number,
    limit: number,
  ): Promise<{ rows: LeaderboardRow[]; total: number }>;
}
