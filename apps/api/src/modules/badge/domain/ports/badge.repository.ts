import { BadgeDefinition, EarnedBadge } from '../entities/badge.entity.js';

export abstract class BadgeRepository {
  abstract findAll(): Promise<BadgeDefinition[]>;
  abstract countAwards(
    userId: string,
    badgeDefinitionId: number,
  ): Promise<number>;
  // Inserts `count` new award records, each a distinct timestamped occurrence.
  abstract awardMany(
    userId: string,
    badgeDefinitionId: number,
    count: number,
  ): Promise<void>;
  abstract findEarnedByUser(userId: string): Promise<EarnedBadge[]>;

  // Progress metrics the evaluation engine checks criteria against. Queried
  // directly here (rather than via the content/progress/quest repositories)
  // to keep badge evaluation decoupled from those modules.
  abstract countCompletedStages(userId: string): Promise<number>;
  // Every passing quest submission counts (retakes included), not just
  // distinct quests — see the Drizzle implementation for why.
  abstract countPassedQuests(userId: string): Promise<number>;
  abstract isZoneCompleted(userId: string, zoneId: number): Promise<boolean>;
}
