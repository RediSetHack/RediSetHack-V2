import { Injectable } from "@nestjs/common";
import type { SharedProfileResponse } from "@repo/contracts";

import { ProfileRepository } from "../domain/ports/profile.repository.js";
import { calculateLevel } from "../domain/level-calculator.js";
import { buildLearningStreak, manilaDay } from "../domain/learning-streak.js";

export class SharedProfileNotFoundError extends Error {}

/** Builds the approved public summary as an explicit allowlist; nothing else about the learner leaves this method. */
@Injectable()
export class GetSharedProfileUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(shareId: string, now = new Date()): Promise<SharedProfileResponse> {
    const userId = await this.profiles.findUserIdByShareId(shareId);
    const data = userId ? await this.profiles.findProfileByUserId(userId) : null;
    if (!userId || !data) throw new SharedProfileNotFoundError(shareId);

    const today = manilaDay(now);
    const { currentStreak, longestStreak } = buildLearningStreak(await this.profiles.findDailyLearningActivity(userId), today, { from: today, to: today });
    return {
      adventurerRank: calculateLevel(data.totalXp),
      totalXp: data.totalXp,
      character: data.character && { name: data.character.name, slug: data.character.slug, imageUrl: data.character.imageUrl },
      badges: data.badges.map(({ name, slug, imageUrl, count }) => ({ name, slug, imageUrl, count })),
      accomplishments: data.accomplishments,
      currentStreak,
      longestStreak,
    };
  }
}
