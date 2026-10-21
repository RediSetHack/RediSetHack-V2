import { Injectable } from "@nestjs/common";

import { ProfileRepository } from "../domain/ports/profile.repository.js";
import { LeaderboardEntry } from "../domain/entities/leaderboard-entry.entity.js";
import { calculateLevel } from "../domain/level-calculator.js";

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  page: number;
  limit: number;
  total: number;
  me: { rank: number; totalXp: number; level: number } | null;
}

@Injectable()
export class GetLeaderboardUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string, page: number, limit: number): Promise<LeaderboardPage> {
    const [{ rows, total }, standing] = await Promise.all([
      this.profiles.findLeaderboardPage(page, limit),
      this.profiles.findLeaderboardStanding(userId),
    ]);
    const offset = (page - 1) * limit;
    const entries = rows.map(
      (row, index) =>
        new LeaderboardEntry(offset + index + 1, row.userId, row.name, row.totalXp, calculateLevel(row.totalXp)),
    );
    const me = standing && { ...standing, level: calculateLevel(standing.totalXp) };
    return { entries, page, limit, total, me };
  }
}
