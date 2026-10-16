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
//
// Per ADR-0003 and Issue #120, each award milestone is uniquely persisted
// to prevent duplicate awards during concurrent evaluations and to allow
// safe retry / recovery after qualifying activities commit.
@Injectable()
export class EvaluateBadgesUseCase {
  constructor(private readonly badges: BadgeRepository) {}

  async execute(userId: string): Promise<BadgeAwardResult[]> {
    const definitions = await this.badges.findAll();
    const results: BadgeAwardResult[] = [];

    for (const badge of definitions) {
      const earnedCount = await this.currentEarnedCount(userId, badge);
      if (earnedCount <= 0) continue;

      const alreadyAwarded = await this.badges.countAwards(userId, badge.id);
      if (alreadyAwarded >= earnedCount) continue;

      const targetMilestones = Array.from(
        { length: earnedCount - alreadyAwarded },
        (_, i) => alreadyAwarded + i + 1,
      );

      let newlyAwarded = 0;
      if (typeof this.badges.awardMilestones === 'function') {
        const inserted = await this.badges.awardMilestones(
          userId,
          badge.id,
          targetMilestones,
        );
        newlyAwarded = inserted.length;
      } else {
        await this.badges.awardMany(userId, badge.id, targetMilestones.length);
        newlyAwarded = targetMilestones.length;
      }

      if (newlyAwarded > 0) {
        results.push({
          badge,
          awardCount: alreadyAwarded + newlyAwarded,
          newAwards: newlyAwarded,
        });
      }
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
