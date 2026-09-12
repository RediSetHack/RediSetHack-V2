import { Injectable } from '@nestjs/common';

import { BadgeDefinition } from '../domain/entities/badge.entity.js';
import { BadgeRepository } from '../domain/ports/badge.repository.js';

export type BadgeAwardResult = {
  badge: BadgeDefinition;
  awardCount: number;
  newAwards: number;
};

// Re-checks every badge definition against the user's current progress and
// awards any newly-crossed thresholds. Cumulative/activity badges repeat
// every `threshold` count crossed (award count = floor(current / threshold));
// category badges award once when their target zone is fully completed.
@Injectable()
export class EvaluateBadgesUseCase {
  constructor(private readonly badges: BadgeRepository) {}

  async execute(userId: string): Promise<BadgeAwardResult[]> {
    const definitions = await this.badges.findAll();
    const results: BadgeAwardResult[] = [];

    for (const badge of definitions) {
      const earnedCount = await this.currentEarnedCount(userId, badge);
      // ponytail: read-then-write, not locked — two evaluate() calls for the
      // same user racing (e.g. a stage completion and a quest pass landing
      // together) can both read the same alreadyAwarded count and both
      // award, over-counting by one. Upgrade to a per-user advisory lock (or
      // a unique (userId, badgeDefinitionId, sequence) constraint) if that
      // ever matters in practice.
      const alreadyAwarded = await this.badges.countAwards(userId, badge.id);
      const newAwards = earnedCount - alreadyAwarded;
      if (newAwards <= 0) continue;

      await this.badges.awardMany(userId, badge.id, newAwards);
      results.push({ badge, awardCount: earnedCount, newAwards });
    }

    return results;
  }

  private async currentEarnedCount(
    userId: string,
    badge: BadgeDefinition,
  ): Promise<number> {
    switch (badge.criteria.trigger) {
      case 'cumulative': {
        const completed = await this.badges.countCompletedStages(userId);
        return Math.floor(completed / badge.criteria.threshold);
      }
      case 'activity': {
        const passed = await this.badges.countPassedQuests(userId);
        return Math.floor(passed / badge.criteria.threshold);
      }
      case 'category': {
        const completed = await this.badges.isZoneCompleted(
          userId,
          badge.criteria.zoneId,
        );
        return completed ? 1 : 0;
      }
    }
  }
}
