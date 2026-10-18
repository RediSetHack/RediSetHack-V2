import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { type Database, ctfAttempts, ctfChallenges, ctfSolves, learningInteractions, stages, users } from '@repo/db';

import { DB } from '../../../database/database.module.js';
import { CtfRateLimitError } from '../domain/errors.js';
import { CtfRepository, type CtfAttemptOutcome, type CtfChallenge } from '../domain/ports/ctf.repository.js';

const ELAPSED_DEFINITION = 'Not measured: a flag submission has no session timer, so elapsed time is left empty.';

const toChallenge = (row: typeof ctfChallenges.$inferSelect): CtfChallenge => ({
  ...row,
  difficulty: row.difficulty as CtfChallenge['difficulty'],
});

@Injectable()
export class DrizzleCtfRepository implements CtfRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<CtfChallenge | null> {
    const [row] = await this.database.select().from(ctfChallenges).where(eq(ctfChallenges.id, id));
    return row && !row.archivedAt ? toChallenge(row) : null;
  }

  async hasArchivedAncestor(challengeId: number): Promise<boolean> {
    const [row] = await this.database
      .select({ archivedAt: stages.archivedAt })
      .from(ctfChallenges)
      .innerJoin(stages, eq(stages.id, ctfChallenges.stageId))
      .where(eq(ctfChallenges.id, challengeId));
    return !row || row.archivedAt !== null;
  }

  async listActive(): Promise<CtfChallenge[]> {
    return (await this.database.select().from(ctfChallenges).where(isNull(ctfChallenges.archivedAt)).orderBy(ctfChallenges.id)).map(toChallenge);
  }

  async solvedChallengeIds(learnerId: string): Promise<Set<number>> {
    const rows = await this.database.select({ id: ctfSolves.challengeId }).from(ctfSolves).where(eq(ctfSolves.learnerId, learnerId));
    return new Set(rows.map((r) => r.id));
  }

  async recordAttempt(challenge: CtfChallenge, learnerId: string, correct: boolean, xp: number, maxPerMinute: number): Promise<CtfAttemptOutcome> {
    return this.database.transaction(async (tx) => {
      // Serializes this learner+challenge so the rate-limit count and the solve gate are exact under concurrency.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`ctf:${learnerId}:${challenge.id}`}, 0))`);
      const [{ recent } = { recent: 0 }] = await tx
        .select({ recent: sql<number>`count(*)::int` })
        .from(ctfAttempts)
        .where(and(eq(ctfAttempts.learnerId, learnerId), eq(ctfAttempts.challengeId, challenge.id), gt(ctfAttempts.submittedAt, sql`now() - interval '1 minute'`)));
      if (recent >= maxPerMinute) throw new CtfRateLimitError();

      const [attempt] = await tx.insert(ctfAttempts).values({ learnerId, challengeId: challenge.id, correct }).returning();
      let xpAwarded = 0;
      let alreadySolved = false;
      let logged = true;
      if (correct) {
        const [solve] = await tx
          .insert(ctfSolves)
          .values({ learnerId, challengeId: challenge.id, attemptId: attempt!.id, xpAwarded: xp })
          .onConflictDoNothing()
          .returning({ id: ctfSolves.id });
        alreadySolved = !solve;
        logged = !alreadySolved;
        if (solve && xp > 0) {
          const [credited] = await tx
            .update(users)
            .set({ totalXp: sql`${users.totalXp} + ${xp}`, updatedAt: new Date() })
            .where(eq(users.id, learnerId))
            .returning({ id: users.id });
          if (!credited) throw new Error('CTF XP recipient not found');
          xpAwarded = xp;
        }
      } else {
        const [solved] = await tx
          .select({ id: ctfSolves.id })
          .from(ctfSolves)
          .where(and(eq(ctfSolves.learnerId, learnerId), eq(ctfSolves.challengeId, challenge.id)));
        // A wrong flag after solving is noise, not evidence about the learner.
        logged = !solved;
      }
      if (logged) {
        await tx.insert(learningInteractions).values({
          learnerId,
          sessionId: `ctf:${attempt!.id}`,
          activityType: 'ctf',
          activityId: challenge.id,
          elapsedDefinition: ELAPSED_DEFINITION,
          contentVersion: challenge.contentVersion,
          skills: challenge.competencyIds,
          difficulty: challenge.difficulty,
          // The submitted flag is deliberately not persisted anywhere.
          answers: { attemptId: attempt!.id },
          correctness: correct,
          outcome: { status: correct ? 'solved' : 'wrong', assessed: true, xpAwarded },
        });
      }
      return { correct, alreadySolved, xpAwarded };
    });
  }
}
