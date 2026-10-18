import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { type Database, userProgress, users, readingSessions, learningInteractions } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { ProgressRepository } from "../domain/ports/progress.repository.js";

@Injectable()
export class DrizzleProgressRepository implements ProgressRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async markCompleted(
    userId: string,
    stageId: number,
    xpEarned: number,
    session: { id: string; startedAt: Date },
    metadata: { contentVersion: string; skills: string[]; difficulty: string | null },
  ): Promise<number | null> {
    return this.database.transaction(async (tx) => {
      const [reading] = await tx.update(readingSessions).set({ completedAt: new Date() }).where(and(eq(readingSessions.id, session.id), eq(readingSessions.learnerId, userId), eq(readingSessions.stageId, stageId), isNull(readingSessions.completedAt))).returning();
      if (!reading) return null;
      const inserted = await tx
        .insert(userProgress)
        .values({ userId, stageId, completed: true, completedAt: new Date() })
        .onConflictDoNothing()
        .returning({ id: userProgress.id });
      if (inserted.length === 0) return null;

      const updated = await tx
        .update(users)
        .set({ totalXp: sql`${users.totalXp} + ${xpEarned}`, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({ totalXp: users.totalXp });
      if (!updated[0]) return null;
      await tx.insert(learningInteractions).values({
        learnerId: userId,
        sessionId: `reading:${session.id}`,
        activityType: 'reading',
        activityId: stageId,
        startedAt: session.startedAt,
        elapsedMs: Math.max(0, Date.now() - session.startedAt.getTime()),
        elapsedDefinition: 'Server elapsed time from first lesson read to accepted completion, including idle time.',
        contentVersion: metadata.contentVersion,
        skills: metadata.skills,
        difficulty: metadata.difficulty,
        correctness: null,
        outcome: { status: 'completed', assessed: false, xpAwarded: xpEarned },
      });
      return updated[0].totalXp;
    });
  }

  async startReadingSession(userId: string, stageId: number): Promise<{ id: string; startedAt: Date }> {
    const [created] = await this.database.insert(readingSessions).values({ learnerId: userId, stageId }).onConflictDoNothing().returning();
    const session = created ?? await this.database.query.readingSessions.findFirst({ where: and(eq(readingSessions.learnerId, userId), eq(readingSessions.stageId, stageId), isNull(readingSessions.completedAt)) });
    return { id: session!.id, startedAt: session!.startedAt };
  }
}
