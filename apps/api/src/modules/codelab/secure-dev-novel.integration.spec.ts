import { spawnSync } from 'node:child_process';
import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  SECURE_DEV_ACTIVITY,
  SECURE_DEV_STAGE_SLUG,
  codingActivities,
  createDb,
  learningInteractions,
  seed,
  stages,
  userProgress,
  users,
  type Database,
} from '@repo/db';
import { CodingActivityResponseSchema, CodingAttemptResponseSchema, LessonResponseSchema } from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';
import { CodeExecutionPort, type ExecutionRequest } from './domain/ports/code-execution.port.js';

const databaseUrl = process.env.DATABASE_URL;

// Runs the learner's program with the local interpreter instead of the Piston sandbox (test code only).
const localPython: CodeExecutionPort = {
  async execute({ code, stdin }: ExecutionRequest) {
    const run = spawnSync('python3', ['-I', '-c', code], { input: stdin, encoding: 'utf8', timeout: 10_000 });
    return {
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: run.status ?? 1,
      executionTimeMs: 5,
      requestDurationMs: 5,
      failureType: run.status === 0 ? ('none' as const) : ('runtime' as const),
    };
  },
};

const SECURE_SOLUTION = SECURE_DEV_ACTIVITY.starterCode.replace(
  `db.execute(f"SELECT role FROM users WHERE name = '{name}'")`,
  `db.execute("SELECT role FROM users WHERE name = ?", (name,))`,
);

describe.skipIf(!databaseUrl)('Secure development activity in the sample Novel', () => {
  const learner = `secure-dev-${Date.now()}`;
  let app: INestApplication;
  let database: Database;
  let activityId: number;
  const as = { authorization: `Bearer ${learner}` };
  const submit = (code: string) =>
    request(app.getHttpServer()).post(`/v1/api/codelab/activities/${activityId}/attempts`).set(as).send({ code });

  beforeAll(async () => {
    await seed(databaseUrl);
    database = createDb(databaseUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort)
      .useValue({
        authenticate: async (req: IncomingMessage) =>
          req.headers.authorization === `Bearer ${learner}`
            ? { id: learner, email: `${learner}@example.test`, name: learner, role: 'user' }
            : null,
      })
      .overrideProvider(DailyEventRepository)
      .useValue({ findByDate: async () => new DailyEvent(1, '2026-10-18', 'normal', 1) })
      .overrideProvider(CodeExecutionPort)
      .useValue(localPython)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await database.insert(users).values({ id: learner, email: `${learner}@example.test`, name: learner });
    const [activity] = await database.select().from(codingActivities).where(eq(codingActivities.authoringId, SECURE_DEV_ACTIVITY.authoringId));
    activityId = activity!.id;
    const [stage] = await database.select().from(stages).where(eq(stages.id, activity!.stageId));
    // Complete the earlier chapters' Stages so the secure-coding Stage is available.
    const earlier = await database
      .select({ id: stages.id })
      .from(stages)
      .where(inArray(stages.slug, ['read-the-signal', 'choose-a-response']));
    expect(stage!.slug).toBe(SECURE_DEV_STAGE_SLUG);
    await database
      .insert(userProgress)
      .values(earlier.map(({ id }) => ({ userId: learner, stageId: id, completed: true, completedAt: new Date() })));
  });

  afterAll(async () => {
    await app?.close();
    if (database) {
      await database.delete(users).where(eq(users.id, learner));
      await (database as unknown as { $client: { end(): Promise<void> } }).$client.end();
    }
  });

  it('teaches the vulnerability in the Lesson and links the exercise to the graded activity', async () => {
    const [{ id: stageId }] = await database.select({ id: stages.id }).from(stages).where(eq(stages.slug, SECURE_DEV_STAGE_SLUG));
    const res = await request(app.getHttpServer()).get(`/v1/api/stages/${stageId}/lesson`).set(as).expect(200);
    const lesson = LessonResponseSchema.parse(res.body);
    expect(lesson.blocks.map((b) => b.type)).toEqual(['text', 'code', 'code', 'text', 'exercise']);
    expect(lesson.blocks.at(-1)).toMatchObject({ type: 'exercise', activityId });
  });

  it('shows objectives and provenance but never hidden checks or the repair', async () => {
    const res = await request(app.getHttpServer()).get(`/v1/api/codelab/activities/${activityId}`).set(as).expect(200);
    const view = CodingActivityResponseSchema.parse(res.body);
    expect(view.objectives.security[0]).toMatch(/SQL injection/);
    expect(view.provenance).toMatchObject({ reviewedAt: '2026-10-18' });
    expect(JSON.stringify(res.body)).not.toMatch(/OR '1'='1|alice' --|hiddenChecks/);
    expect(res.body.starterCode).not.toContain('(name,)');
  });

  it('fails the vulnerable solution on the security checks and passes the secure repair', async () => {
    const vulnerable = await submit(SECURE_DEV_ACTIVITY.starterCode).expect(201);
    CodingAttemptResponseSchema.parse(vulnerable.body);
    // Normal behaviour passes (3 of 5 checks); the two injection checks fail.
    expect(vulnerable.body).toMatchObject({ passed: false, score: 60, checksPassed: 3, checksTotal: 5, errorCategory: 'wrong_answer', xpAwarded: 0 });

    const secure = await submit(SECURE_SOLUTION).expect(201);
    expect(secure.body).toMatchObject({ passed: true, score: 100, xpAwarded: 20 });
    expect((await submit(SECURE_SOLUTION).expect(201)).body.xpAwarded).toBe(0);
  });

  it('records assessed security skill outcomes with resource provenance', async () => {
    const rows = await database
      .select()
      .from(learningInteractions)
      .where(and(eq(learningInteractions.learnerId, learner), eq(learningInteractions.activityId, activityId)));
    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      expect(row.skills).toContain('security.secure-coding');
      expect(row.outcome).toMatchObject({ assessed: true, provenance: { reviewedAt: '2026-10-18' } });
    }
    expect(rows.filter((r) => r.correctness)).toHaveLength(2);
  });
});
