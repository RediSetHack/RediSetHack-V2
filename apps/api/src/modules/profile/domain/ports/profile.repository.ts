import { BadgeAwardSummary } from "../entities/badge-award-summary.entity.js";
import { ProfileCharacter } from "../entities/user-profile.entity.js";
import type { InitialCompetencyBaseline, LearningDay } from "@repo/contracts";

export interface ProfileData {
  userId: string;
  totalXp: number;
  character: ProfileCharacter | null;
  badges: BadgeAwardSummary[];
  activity: { id: string; activityType: 'quest' | 'reading' | 'ctf'; activityId: number; occurredAt: Date; outcome: unknown }[];
  initialCompetencyBaseline: InitialCompetencyBaseline | null;
}

export interface LeaderboardRow {
  userId: string;
  name: string | null;
  totalXp: number;
}

export abstract class ProfileRepository {
  abstract findProfileByUserId(userId: string): Promise<ProfileData | null>;
  /** Qualifying accomplishments per Asia/Manila day over the learner's whole history (active days only). */
  abstract findDailyLearningActivity(userId: string): Promise<LearningDay[]>;
  abstract findLeaderboardPage(
    page: number,
    limit: number,
  ): Promise<{ rows: LeaderboardRow[]; total: number }>;
}
