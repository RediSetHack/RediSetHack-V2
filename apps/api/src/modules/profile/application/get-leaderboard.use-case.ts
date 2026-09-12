import { Injectable } from "@nestjs/common";

import { ProfileRepository } from "../domain/ports/profile.repository.js";
import { LeaderboardEntry } from "../domain/entities/leaderboard-entry.entity.js";
import { calculateLevel } from "../domain/level-calculator.js";

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class GetLeaderboardUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(page: number, limit: number): Promise<LeaderboardPage> {
    const { rows, total } = await this.profiles.findLeaderboardPage(page, limit);
    const offset = (page - 1) * limit;
    const entries = rows.map(
      (row, index) =>
        new LeaderboardEntry(offset + index + 1, row.userId, row.name, row.totalXp, calculateLevel(row.totalXp)),
    );
    return { entries, page, limit, total };
  }
}
