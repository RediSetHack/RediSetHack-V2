import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import {
  type Database,
  codingActivities,
  codingAttempts,
  codingXpAwards,
  learningInteractions,
  stages,
  users,
} from '@repo/db';

import { DB } from '../../../database/database.module.js';
import type {
  CodingActivity,
  CodingAttempt,
  CodingErrorCategory,
} from '../domain/entities/coding-activity.entity.js';
import type { SupportedLanguage } from '../domain/ports/code-execution.port.js';
import {
  CodingActivityRepository,
  type NewCodingAttempt,
} from '../domain/ports/coding-activity.repository.js';

const ELAPSED_DEFINITION =
  'Sandbox execution time summed across all checks of one submission; excludes network latency and learner think time.';

function toActivity(row: typeof codingActivities.$inferSelect): CodingActivity {
  return {
    ...row,
    language: row.language as SupportedLanguage,
    difficulty: row.difficulty as CodingActivity['difficulty'],
  };
}

function toAttempt(row: typeof codingAttempts.$inferSelect): CodingAttempt {
  return { ...row, errorCategory: row.errorCategory as CodingErrorCategory };
}

@Injectable()
export class DrizzleCodingActivityRepository implements CodingActivityRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<CodingActivity | null> {
    const [row] = await this.database.select().from(codingActivities).where(eq(codingActivities.id, id));
    return row && !row.archivedAt ? toActivity(row) : null;
  }

  async hasArchivedAncestor(activityId: number): Promise<boolean> {
    const [row] = await this.database
      .select({ archivedAt: stages.archivedAt })
      .from(codingActivities)
      .innerJoin(stages, eq(stages.id, codingActivities.stageId))
      .where(eq(codingActivities.id, activityId));
    return !row || row.archivedAt !== null;
  }

  async upsert(activity: Omit<CodingActivity, 'id'>): Promise<CodingActivity> {
    const { authoringId: _identity, ...mutable } = activity;
    const [row] = await this.database
      .insert(codingActivities)
      .values(activity)
      .onConflictDoUpdate({ target: codingActivities.authoringId, set: mutable })
      .returning();
    return toActivity(row!);
  }

  async recordAttempt(activity: CodingActivity, attempt: NewCodingAttempt, xp: number): Promise<CodingAttempt> {
    return this.database.transaction(async (tx) => {
      const [row] = await tx.insert(codingAttempts).values(attempt).returning();
      let xpAwarded = 0;
      if (attempt.passed && xp > 0) {
        const [award] = await tx
          .insert(codingXpAwards)
          .values({ learnerId: attempt.learnerId, activityId: activity.id, attemptId: row!.id })
          .onConflictDoNothing()
          .returning({ id: codingXpAwards.id });
        if (award) {
          const [credited] = await tx
            .update(users)
            .set({ totalXp: sql`${users.totalXp} + ${xp}`, updatedAt: new Date() })
            .where(eq(users.id, attempt.learnerId))
            .returning({ id: users.id });
          if (!credited) throw new Error('Coding XP recipient not found');
          xpAwarded = xp;
          await tx.update(codingAttempts).set({ xpAwarded }).where(eq(codingAttempts.id, row!.id));
        }
      }
      await tx.insert(learningInteractions).values({
        learnerId: attempt.learnerId,
        sessionId: `coding:${row!.id}`,
        activityType: 'coding',
        activityId: activity.id,
        elapsedMs: attempt.elapsedMs,
        elapsedDefinition: ELAPSED_DEFINITION,
        contentVersion: activity.contentVersion,
        skills: activity.competencyIds,
        difficulty: activity.difficulty,
        // Code is kept only on the owner-scoped attempt row, not duplicated into research events.
        answers: { attemptId: row!.id },
        correctness: attempt.passed,
        outcome: {
          status: attempt.passed ? 'passed' : 'failed',
          assessed: true,
          score: attempt.score,
          xpAwarded,
        },
        errors: attempt.errorCategory === 'none' ? null : [{ category: attempt.errorCategory }],
      });
      return toAttempt({ ...row!, xpAwarded });
    });
  }

  async findAttempt(attemptId: string, learnerId: string): Promise<CodingAttempt | null> {
    const [row] = await this.database
      .select()
      .from(codingAttempts)
      .where(and(eq(codingAttempts.id, attemptId), eq(codingAttempts.learnerId, learnerId)));
    return row ? toAttempt(row) : null;
  }
}
