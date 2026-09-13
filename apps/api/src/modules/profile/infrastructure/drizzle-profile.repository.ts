import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";
import { badgeAwards, badgeDefinitions, characters, users, type Database } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import {
  ProfileRepository,
  type LeaderboardRow,
  type ProfileData,
} from "../domain/ports/profile.repository.js";
import { BadgeAwardSummary } from "../domain/entities/badge-award-summary.entity.js";

@Injectable()
export class DrizzleProfileRepository implements ProfileRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findProfileByUserId(userId: string): Promise<ProfileData | null> {
    const user = await this.database.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return null;

    const character = user.characterId
      ? ((await this.database.query.characters.findFirst({
          where: eq(characters.id, user.characterId),
        })) ?? null)
      : null;

    const badgeRows = await this.database
      .select({
        badgeDefinitionId: badgeAwards.badgeDefinitionId,
        name: badgeDefinitions.name,
        slug: badgeDefinitions.slug,
        imageUrl: badgeDefinitions.imageUrl,
        count: sql<number>`count(*)::int`,
        latestAwardedAt: sql<Date>`max(${badgeAwards.awardedAt})`,
      })
      .from(badgeAwards)
      .innerJoin(badgeDefinitions, eq(badgeAwards.badgeDefinitionId, badgeDefinitions.id))
      .where(eq(badgeAwards.userId, userId))
      .groupBy(
        badgeAwards.badgeDefinitionId,
        badgeDefinitions.name,
        badgeDefinitions.slug,
        badgeDefinitions.imageUrl,
      );

    return {
      userId: user.id,
      totalXp: user.totalXp,
      character: character
        ? { id: character.id, name: character.name, slug: character.slug, imageUrl: character.imageUrl }
        : null,
      badges: badgeRows.map(
        (row) =>
          new BadgeAwardSummary(
            row.badgeDefinitionId,
            row.name,
            row.slug,
            row.imageUrl,
            row.count,
            row.latestAwardedAt,
          ),
      ),
    };
  }

  async findLeaderboardPage(
    page: number,
    limit: number,
  ): Promise<{ rows: LeaderboardRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      this.database
        .select({ userId: users.id, name: users.name, totalXp: users.totalXp })
        .from(users)
        .orderBy(desc(users.totalXp))
        .limit(limit)
        .offset(offset),
      this.database.select({ count: sql<number>`count(*)::int` }).from(users),
    ]);
    return { rows, total: countRows[0]?.count ?? 0 };
  }
}
