import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { SideQuestPrerequisite } from '@repo/contracts';
import {
  type Database,
  badgeAwards,
  badgeDefinitions,
  codingActivities,
  codingAttempts,
  ctfChallenges,
  ctfSolves,
  learningInteractions,
  regions,
  results,
  sideQuestCompletions,
  sideQuestStarts,
  sideQuests,
  stages,
  userProgress,
  users,
  zones,
} from '@repo/db';

import { DB } from '../../../database/database.module.js';
import { calculateLevel } from '../../profile/domain/level-calculator.js';
import type { LearnerFacts } from '../domain/prerequisites.js';
import { SideQuestRepository, type SideQuest, type SideQuestProgress } from '../domain/ports/side-quest.repository.js';

const ELAPSED_DEFINITION = 'Not measured: a Side Quest completion is the designated activity passing; no session timer exists.';

@Injectable()
export class DrizzleSideQuestRepository implements SideQuestRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async listActive(): Promise<SideQuest[]> {
    const rows = await this.database.select().from(sideQuests).where(isNull(sideQuests.archivedAt)).orderBy(sideQuests.id);
    const all = await Promise.all(rows.map((row) => this.hydrate(row)));
    return all.filter((q): q is SideQuest => q !== null);
  }

  async findById(id: number): Promise<SideQuest | null> {
    const [row] = await this.database.select().from(sideQuests).where(and(eq(sideQuests.id, id), isNull(sideQuests.archivedAt)));
    return row ? this.hydrate(row) : null;
  }

  /** Joins in the designated activity; null when it (or its Stage) has been archived or removed. */
  private async hydrate(row: typeof sideQuests.$inferSelect): Promise<SideQuest | null> {
    const table = row.activityType === 'ctf' ? ctfChallenges : codingActivities;
    const [activity] = await this.database
      .select({ competencyIds: table.competencyIds, difficulty: table.difficulty })
      .from(table)
      .innerJoin(stages, eq(stages.id, table.stageId))
      .where(and(eq(table.id, row.activityId), isNull(table.archivedAt), isNull(stages.archivedAt)));
    if (!activity) return null;
    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      brief: row.brief,
      activityType: row.activityType,
      activityId: row.activityId,
      prerequisites: row.prerequisites as SideQuestPrerequisite[],
      xpReward: row.xpReward,
      contentVersion: row.contentVersion,
      competencyIds: activity.competencyIds,
      difficulty: activity.difficulty,
    };
  }

  factsFor(learnerId: string): LearnerFacts {
    const exists = async (query: Promise<unknown[]>) => (await query).length > 0;
    return {
      level: async () => {
        const [user] = await this.database.select({ xp: users.totalXp }).from(users).where(eq(users.id, learnerId));
        return calculateLevel(user?.xp ?? 0);
      },
      hasBadge: (slug) =>
        exists(
          this.database
            .select({ id: badgeAwards.id })
            .from(badgeAwards)
            .innerJoin(badgeDefinitions, eq(badgeDefinitions.id, badgeAwards.badgeDefinitionId))
            .where(and(eq(badgeAwards.userId, learnerId), eq(badgeDefinitions.slug, slug)))
            .limit(1),
        ),
      completedNovel: async (regionSlug) => {
        // A Novel is a Region with a story introduction; it is complete when every active Stage in it is.
        const [{ total, done } = { total: 0, done: 0 }] = await this.database
          .select({
            total: sql<number>`count(${stages.id})::int`,
            done: sql<number>`count(${userProgress.id}) filter (where ${userProgress.completed})::int`,
          })
          .from(regions)
          .innerJoin(zones, and(eq(zones.regionId, regions.id), isNull(zones.archivedAt)))
          .innerJoin(stages, and(eq(stages.zoneId, zones.id), isNull(stages.archivedAt)))
          .leftJoin(userProgress, and(eq(userProgress.stageId, stages.id), eq(userProgress.userId, learnerId)))
          .where(and(eq(regions.slug, regionSlug), isNull(regions.archivedAt), sql`${regions.storyIntro} is not null`));
        return total > 0 && done === total;
      },
      completedActivity: (type, id) => {
        switch (type) {
          case 'ctf':
            return exists(this.database.select({ id: ctfSolves.id }).from(ctfSolves).where(and(eq(ctfSolves.learnerId, learnerId), eq(ctfSolves.challengeId, id))).limit(1));
          case 'coding':
            return exists(this.database.select({ id: codingAttempts.id }).from(codingAttempts).where(and(eq(codingAttempts.learnerId, learnerId), eq(codingAttempts.activityId, id), eq(codingAttempts.passed, true))).limit(1));
          case 'quest':
            return exists(this.database.select({ id: results.id }).from(results).where(and(eq(results.userId, learnerId), eq(results.questId, id), eq(results.passed, true))).limit(1));
          case 'side_quest':
            return exists(this.database.select({ id: sideQuestCompletions.id }).from(sideQuestCompletions).where(and(eq(sideQuestCompletions.learnerId, learnerId), eq(sideQuestCompletions.sideQuestId, id))).limit(1));
        }
      },
    };
  }

  async progress(learnerId: string): Promise<Map<number, SideQuestProgress>> {
    const [starts, done] = await Promise.all([
      this.database.select().from(sideQuestStarts).where(eq(sideQuestStarts.learnerId, learnerId)),
      this.database.select({ id: sideQuestCompletions.sideQuestId }).from(sideQuestCompletions).where(eq(sideQuestCompletions.learnerId, learnerId)),
    ]);
    const completed = new Set(done.map((d) => d.id));
    const map = new Map<number, SideQuestProgress>();
    for (const s of starts) map.set(s.sideQuestId, { startedAt: s.startedAt, completed: completed.has(s.sideQuestId) });
    for (const id of completed) if (!map.has(id)) map.set(id, { startedAt: null, completed: true });
    return map;
  }

  async start(learnerId: string, sideQuestId: number): Promise<Date> {
    await this.database.insert(sideQuestStarts).values({ learnerId, sideQuestId }).onConflictDoNothing();
    const [row] = await this.database
      .select()
      .from(sideQuestStarts)
      .where(and(eq(sideQuestStarts.learnerId, learnerId), eq(sideQuestStarts.sideQuestId, sideQuestId)));
    return row!.startedAt;
  }

  async hasStarted(learnerId: string, sideQuestId: number): Promise<boolean> {
    const [row] = await this.database
      .select({ id: sideQuestStarts.id })
      .from(sideQuestStarts)
      .where(and(eq(sideQuestStarts.learnerId, learnerId), eq(sideQuestStarts.sideQuestId, sideQuestId)));
    return !!row;
  }

  async complete(sideQuest: SideQuest, learnerId: string, xp: number) {
    return this.database.transaction(async (tx) => {
      const [completion] = await tx
        .insert(sideQuestCompletions)
        .values({ learnerId, sideQuestId: sideQuest.id, xpAwarded: xp })
        .onConflictDoNothing()
        .returning({ id: sideQuestCompletions.id });
      if (!completion) return { alreadyCompleted: true, xpAwarded: 0 };
      if (xp > 0) {
        const [credited] = await tx
          .update(users)
          .set({ totalXp: sql`${users.totalXp} + ${xp}`, updatedAt: new Date() })
          .where(eq(users.id, learnerId))
          .returning({ id: users.id });
        if (!credited) throw new Error('Side Quest XP recipient not found');
      }
      const [event] = await tx
        .insert(learningInteractions)
        .values({
          learnerId,
          sessionId: `side_quest:${sideQuest.id}:${learnerId}`,
          activityType: 'side_quest',
          activityId: sideQuest.id,
          elapsedDefinition: ELAPSED_DEFINITION,
          contentVersion: sideQuest.contentVersion,
          skills: sideQuest.competencyIds,
          difficulty: sideQuest.difficulty,
          answers: { designatedActivity: { type: sideQuest.activityType, id: sideQuest.activityId } },
          correctness: true,
          outcome: { status: 'completed', assessed: true, xpAwarded: xp },
        })
        .returning({ id: learningInteractions.id });
      await tx.update(sideQuestCompletions).set({ eventId: event!.id }).where(eq(sideQuestCompletions.id, completion.id));
      return { alreadyCompleted: false, xpAwarded: xp };
    });
  }
}
