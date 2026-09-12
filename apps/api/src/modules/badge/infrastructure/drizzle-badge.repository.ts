import { Inject, Injectable } from "@nestjs/common";
import { and, asc, count, countDistinct, desc, eq, sql } from "drizzle-orm";
import {
  badgeAwards,
  badgeDefinitions,
  results,
  stages,
  userProgress,
  type Database,
} from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { BadgeCriteria, BadgeDefinition, EarnedBadge } from "../domain/entities/badge.entity.js";
import { BadgeRepository } from "../domain/ports/badge.repository.js";

type BadgeDefinitionRow = typeof badgeDefinitions.$inferSelect;

function toDomain(row: BadgeDefinitionRow): BadgeDefinition {
  return new BadgeDefinition(
    row.id,
    row.name,
    row.slug,
    row.description,
    row.criteriaJson as BadgeCriteria,
    row.imageUrl,
  );
}

@Injectable()
export class DrizzleBadgeRepository implements BadgeRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findAll(): Promise<BadgeDefinition[]> {
    const rows = await this.database.query.badgeDefinitions.findMany({
      orderBy: asc(badgeDefinitions.id),
    });
    return rows.map(toDomain);
  }

  async countAwards(userId: string, badgeDefinitionId: number): Promise<number> {
    const [row] = await this.database
      .select({ value: count() })
      .from(badgeAwards)
      .where(
        and(eq(badgeAwards.userId, userId), eq(badgeAwards.badgeDefinitionId, badgeDefinitionId)),
      );
    return row?.value ?? 0;
  }

  async awardMany(userId: string, badgeDefinitionId: number, times: number): Promise<void> {
    if (times <= 0) return;
    await this.database
      .insert(badgeAwards)
      .values(Array.from({ length: times }, () => ({ userId, badgeDefinitionId })));
  }

  async findEarnedByUser(userId: string): Promise<EarnedBadge[]> {
    const rows = await this.database
      .select({ badge: badgeDefinitions, awardedAt: badgeAwards.awardedAt })
      .from(badgeAwards)
      .innerJoin(badgeDefinitions, eq(badgeAwards.badgeDefinitionId, badgeDefinitions.id))
      .where(eq(badgeAwards.userId, userId))
      .orderBy(desc(badgeAwards.awardedAt));

    const byBadgeId = new Map<number, EarnedBadge>();
    for (const row of rows) {
      const existing = byBadgeId.get(row.badge.id);
      if (existing) {
        existing.count += 1;
        existing.awardedAt.push(row.awardedAt);
      } else {
        byBadgeId.set(row.badge.id, {
          badge: toDomain(row.badge),
          count: 1,
          awardedAt: [row.awardedAt],
        });
      }
    }
    return [...byBadgeId.values()];
  }

  async countCompletedStages(userId: string): Promise<number> {
    const [row] = await this.database
      .select({ value: count() })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.completed, true)));
    return row?.value ?? 0;
  }

  async countPassedQuests(userId: string): Promise<number> {
    const [row] = await this.database
      .select({ value: countDistinct(results.questId) })
      .from(results)
      .where(and(eq(results.userId, userId), eq(results.passed, true)));
    return row?.value ?? 0;
  }

  async isZoneCompleted(userId: string, zoneId: number): Promise<boolean> {
    const [row] = await this.database
      .select({
        total: count(),
        completed: sql<number>`count(*) filter (where ${userProgress.completed} = true and ${userProgress.userId} = ${userId})`,
      })
      .from(stages)
      .leftJoin(
        userProgress,
        and(eq(userProgress.stageId, stages.id), eq(userProgress.userId, userId)),
      )
      .where(eq(stages.zoneId, zoneId));

    if (!row || row.total === 0) return false;
    return Number(row.completed) >= row.total;
  }
}
