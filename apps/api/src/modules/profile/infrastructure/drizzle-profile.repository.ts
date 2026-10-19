import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, sql } from "drizzle-orm";
import { badgeAwards, badgeDefinitions, characters, users, learningInteractions, initialCompetencyBaselines, type Database } from "@repo/db";
import { COMPETENCIES, type LearningDay } from "@repo/contracts";

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
    const activityRows = await this.database.query.learningInteractions.findMany({
      where: eq(learningInteractions.learnerId, userId),
      orderBy: [desc(learningInteractions.occurredAt)],
      limit: 10,
      columns: { id: true, activityType: true, activityId: true, occurredAt: true, outcome: true },
    });
    const baseline = await this.database.query.initialCompetencyBaselines.findFirst({ where: eq(initialCompetencyBaselines.userId, userId) });

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
      activity: activityRows.map((row) => ({ ...row, activityType: row.activityType as 'quest' | 'reading' | 'ctf' })),
      initialCompetencyBaseline: baseline ? {
        assessmentId: baseline.questId,
        assessmentVersion: baseline.assessmentVersion,
        completedAt: baseline.completedAt.toISOString(),
        skills: COMPETENCIES.map(({ id }) => {
          const score = baseline.skills[id];
          return { id, assessed: score?.assessed ?? 0, correct: score?.correct ?? 0, score: score?.score ?? null };
        }),
      } : null,
    };
  }

  // Qualifying = a persisted accomplishment: reading completed, Quest submitted and passed, or a
  // coding/CTF/Side Quest outcome of passed/solved/completed. Failed attempts, expired Quests and
  // wrong flags are not accomplishments. See ADR 0008.
  async findDailyLearningActivity(userId: string): Promise<LearningDay[]> {
    const { activityType, outcome, occurredAt, learnerId } = learningInteractions;
    const date = sql<string>`to_char(${occurredAt} at time zone 'Asia/Manila', 'YYYY-MM-DD')`;
    return this.database
      .select({
        date,
        reading: sql<number>`(count(*) filter (where ${activityType} = 'reading'))::int`,
        assessed: sql<number>`(count(*) filter (where ${activityType} <> 'reading'))::int`,
      })
      .from(learningInteractions)
      .where(
        and(
          eq(learnerId, userId),
          sql`(${outcome}->>'status' in ('completed', 'passed', 'solved')
            or (${activityType} = 'quest' and ${outcome}->>'status' = 'submitted' and ${outcome}->>'passed' = 'true'))`,
        ),
      )
      .groupBy(date)
      .orderBy(date);
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
