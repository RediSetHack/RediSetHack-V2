import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, learningInteractions, users, type Database } from '@repo/db';
import { LearningStreakResponseSchema } from '@repo/contracts';

import { DrizzleProfileRepository } from './infrastructure/drizzle-profile.repository.js';
import { GetLearningStreakUseCase } from './application/get-learning-streak.use-case.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('Learning streak qualifying events with PostgreSQL', () => {
  const learner = `streak-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let database: Database;
  let useCase: GetLearningStreakUseCase;
  let n = 0;
  const record = (activityType: 'quest' | 'reading' | 'coding' | 'ctf' | 'side_quest', outcome: object, at: string, sessionId?: string) =>
    database
      .insert(learningInteractions)
      .values({
        learnerId: learner,
        sessionId: sessionId ?? `${learner}:${n++}`,
        activityType,
        activityId: 1,
        occurredAt: new Date(at),
        elapsedDefinition: 'test',
        contentVersion: '1',
        outcome,
      })
      .onConflictDoNothing();

  beforeAll(async () => {
    database = createDb(databaseUrl!);
    useCase = new GetLearningStreakUseCase(new DrizzleProfileRepository(database));
    await database.insert(users).values({ id: learner, email: `${learner}@example.test`, name: learner });
    await record('reading', { status: 'completed', assessed: false, xpAwarded: 5 }, '2026-10-16T15:59:59Z'); // Oct 16 23:59:59 Manila
    await record('reading', { status: 'completed', assessed: false, xpAwarded: 5 }, '2026-10-16T16:00:00Z'); // Oct 17 00:00:00 Manila
    await record('quest', { status: 'submitted', passed: true, score: 90, xpAwarded: 10 }, '2026-10-17T05:00:00Z', 'dup-session');
    await record('quest', { status: 'submitted', passed: true, score: 90, xpAwarded: 10 }, '2026-10-17T05:00:00Z', 'dup-session'); // replay
    await record('coding', { status: 'passed', assessed: true, score: 100, xpAwarded: 10 }, '2026-10-18T02:00:00Z');
    // Not accomplishments: failed quest, expired quest, failed coding, wrong flag, raw non-qualifying.
    await record('quest', { status: 'submitted', passed: false, score: 10, xpAwarded: 0 }, '2026-10-14T02:00:00Z');
    await record('quest', { status: 'expired', passed: false, score: 0, xpAwarded: 0 }, '2026-10-14T03:00:00Z');
    await record('coding', { status: 'failed', assessed: true, score: 0, xpAwarded: 0 }, '2026-10-14T04:00:00Z');
    await record('ctf', { status: 'wrong', assessed: true, xpAwarded: 0 }, '2026-10-14T05:00:00Z');
  });

  afterAll(async () => {
    await database?.delete(users).where(eq(users.id, learner));
  });

  it('buckets by Asia/Manila day, counts replays once, and excludes non-accomplishments', async () => {
    const result = await useCase.execute(learner, '2026-10-14', '2026-10-18', new Date('2026-10-18T10:00:00Z'));
    LearningStreakResponseSchema.parse(result);
    expect(result.days).toEqual([
      { date: '2026-10-14', reading: 0, assessed: 0 },
      { date: '2026-10-15', reading: 0, assessed: 0 },
      { date: '2026-10-16', reading: 1, assessed: 0 },
      { date: '2026-10-17', reading: 1, assessed: 1 },
      { date: '2026-10-18', reading: 0, assessed: 1 },
    ]);
    expect(result).toMatchObject({ currentStreak: 3, longestStreak: 3 });
  });

  it('yields the same history whichever time the same range is requested', async () => {
    const early = await useCase.execute(learner, '2026-10-14', '2026-10-18', new Date('2026-10-18T16:30:00Z'));
    const late = await useCase.execute(learner, '2026-10-14', '2026-10-18', new Date('2026-10-30T01:00:00Z'));
    expect(late.days).toEqual(early.days);
    expect(early.currentStreak).toBe(3); // Oct 19 not yet active, streak held through Oct 18
    expect(late.currentStreak).toBe(0);
  });
});
