import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDb,
  codingAttempts,
  learningInteractions,
  regions,
  userProgress,
  users,
  type Database,
} from '@repo/db';
import { CodingActivityResponseSchema, CodingAttemptResponseSchema } from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import { CodeExecutionPort, type ExecutionRequest } from './domain/ports/code-execution.port.js';
import { CodingActivityRepository } from './domain/ports/coding-activity.repository.js';
import { CodeExecutionTimeoutError, CodeExecutionUnavailableError } from './domain/errors.js';
import { stages, zones } from '@repo/db';

const databaseUrl = process.env.DATABASE_URL;

// Stands in for the sandbox: the "program" is selected by a marker in the submitted code.
const fakeExecution: CodeExecutionPort = {
  async execute({ code, stdin }: ExecutionRequest) {
    if (code.includes('TIMEOUT')) throw new CodeExecutionTimeoutError();
    if (code.includes('UNAVAILABLE')) throw new CodeExecutionUnavailableError();
    const ok = { stderr: '', exitCode: 0, executionTimeMs: 5, requestDurationMs: 9, failureType: 'none' as const };
    if (code.includes('WRONG')) return { ...ok, stdout: '999\n' };
    const [a, b] = stdin.split(' ').map(Number);
    return { ...ok, stdout: `${a! + b!}\n` };
  },
};

describe.skipIf(!databaseUrl)('Graded coding activity through HTTP with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const learner = `coding-a-${suffix}`;
  const other = `coding-b-${suffix}`;
  let app: INestApplication;
  let database: Database;
  let regionId: number;
  let activityId: number;
  const as = (id: string) => ({ authorization: `Bearer ${id}` });
  const submit = (code: string, id = learner) =>
    request(app.getHttpServer()).post(`/v1/api/codelab/activities/${activityId}/attempts`).set(as(id)).send({ code });
  const totalXp = async () => (await database.select().from(users).where(eq(users.id, learner)))[0]!.totalXp;

  beforeAll(async () => {
    database = createDb(databaseUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort)
      .useValue({
        authenticate: async (req: IncomingMessage) => {
          const id = req.headers.authorization?.replace('Bearer ', '');
          return id === learner || id === other ? { id, email: `${id}@example.test`, name: id, role: 'user' } : null;
        },
      })
      .overrideProvider(DailyEventRepository)
      .useValue({ findByDate: async () => new DailyEvent(1, '2026-10-17', 'normal', 1) })
      .overrideProvider(CodeExecutionPort)
      .useValue(fakeExecution)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await database.insert(users).values([learner, other].map((id) => ({ id, email: `${id}@example.test`, name: id })));
    const [region] = await database.insert(regions).values({ name: 'Coding', slug: `coding-${suffix}` }).returning();
    regionId = region!.id;
    const [zone] = await database.insert(zones).values({ regionId, name: 'Coding', slug: `coding-${suffix}` }).returning();
    const [first, second] = await database
      .insert(stages)
      .values([
        { zoneId: zone!.id, title: 'First', slug: `a-${suffix}`, sortOrder: 10 },
        { zoneId: zone!.id, title: 'Sum', slug: `b-${suffix}`, sortOrder: 20 },
      ])
      .returning();
    await database.insert(userProgress).values({ userId: learner, stageId: first!.id, completed: true, completedAt: new Date() });
    const activity = await app.get(CodingActivityRepository).upsert({
      stageId: second!.id,
      authoringId: `sum-two-${suffix}`,
      title: 'Sum two numbers',
      prompt: 'Read two integers and print their sum.',
      language: 'python',
      starterCode: 'a, b = map(int, input().split())\n',
      competencyIds: ['programming.control-flow'],
      difficulty: 'beginner',
      objectives: { programming: [], security: [] },
      provenance: null,
      visibleExamples: [{ input: '1 2', expected: '3' }],
      hiddenChecks: [{ input: '1000000 234567', expected: '1234567' }],
      passingScore: 100,
      xpReward: 10,
      contentVersion: '1',
    });
    activityId = activity.id;
  });

  afterAll(async () => {
    await app?.close();
    if (database) {
      await database.delete(regions).where(eq(regions.id, regionId));
      for (const id of [learner, other]) await database.delete(users).where(eq(users.id, id));
      await (database as unknown as { $client: { end(): Promise<void> } }).$client.end();
    }
  });

  it('shows the activity without hidden checks or the expected solution', async () => {
    const res = await request(app.getHttpServer()).get(`/v1/api/codelab/activities/${activityId}`).set(as(learner)).expect(200);
    CodingActivityResponseSchema.parse(res.body);
    expect(res.body.visibleExamples).toEqual([{ input: '1 2', expected: '3' }]);
    expect(JSON.stringify(res.body)).not.toMatch(/1234567|hidden/i);
  });

  it('grades wrong, timeout and unavailable submissions without paying XP', async () => {
    const wrong = await submit('WRONG').expect(201);
    CodingAttemptResponseSchema.parse(wrong.body);
    expect(wrong.body).toMatchObject({ passed: false, score: 0, errorCategory: 'wrong_answer', xpAwarded: 0, checksTotal: 2 });
    expect(wrong.body.visibleResults).toEqual([{ input: '1 2', expected: '3', actual: '999\n', passed: false }]);
    expect(JSON.stringify(wrong.body)).not.toContain('1234567');

    const timeout = await submit('TIMEOUT').expect(201);
    expect(timeout.body).toMatchObject({ passed: false, errorCategory: 'timeout', xpAwarded: 0 });

    const before = await database.select().from(codingAttempts).where(eq(codingAttempts.learnerId, learner));
    await submit('UNAVAILABLE').expect(503);
    expect(await database.select().from(codingAttempts).where(eq(codingAttempts.learnerId, learner))).toHaveLength(before.length);
    expect(await totalXp()).toBe(0);
  });

  it('awards XP once on the first pass and keeps retries reward-free', async () => {
    const first = await submit('print(sum)').expect(201);
    expect(first.body).toMatchObject({ passed: true, score: 100, errorCategory: 'none', xpAwarded: 10 });
    expect(await totalXp()).toBe(10);

    const concurrent = await Promise.all([submit('print(sum)'), submit('print(sum)')]);
    for (const res of concurrent) expect([201, 429]).toContain(res.status);
    expect((await submit('print(sum)').expect(201)).body.xpAwarded).toBe(0);
    expect(await totalXp()).toBe(10);
  });

  it('records one learning interaction per attempt and lets the owner review it', async () => {
    const attempts = await database.select().from(codingAttempts).where(eq(codingAttempts.learnerId, learner));
    const interactions = await database.select().from(learningInteractions).where(eq(learningInteractions.learnerId, learner));
    expect(interactions).toHaveLength(attempts.length);
    expect(interactions[0]).toMatchObject({ activityType: 'coding', activityId });
    expect(JSON.stringify(interactions)).not.toContain('print(sum)');

    const passed = attempts.find((a) => a.passed)!;
    const res = await request(app.getHttpServer()).get(`/v1/api/codelab/attempts/${passed.id}`).set(as(learner)).expect(200);
    expect(CodingAttemptResponseSchema.parse(res.body).code).toBe('print(sum)');
  });

  it("denies another learner's attempt review and a locked Stage", async () => {
    const [attempt] = await database.select().from(codingAttempts).where(eq(codingAttempts.learnerId, learner));
    await request(app.getHttpServer()).get(`/v1/api/codelab/attempts/${attempt!.id}`).set(as(other)).expect(404);
    await request(app.getHttpServer()).get(`/v1/api/codelab/activities/${activityId}`).set(as(other)).expect(403);
    await submit('print(sum)', other).expect(403);
    await request(app.getHttpServer()).get(`/v1/api/codelab/activities/${activityId}`).expect(401);
  });
});
