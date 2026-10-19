import { Injectable } from "@nestjs/common";

import { ProfileRepository } from "../domain/ports/profile.repository.js";
import { buildLearningStreak, manilaDay, resolveRange } from "../domain/learning-streak.js";

@Injectable()
export class GetLearningStreakUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string, from?: string, to?: string, now = new Date()) {
    const today = manilaDay(now);
    const range = resolveRange(today, from, to);
    return buildLearningStreak(await this.profiles.findDailyLearningActivity(userId), today, range);
  }
}
