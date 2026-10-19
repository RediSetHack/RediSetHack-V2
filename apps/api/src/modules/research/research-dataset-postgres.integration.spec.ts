import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, deletedUsers, learningInteractions, users, type Database } from '@repo/db';
import { DatasetExportSchema } from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';
import { RESEARCH_PSEUDONYM_KEY } from './application/export-dataset.use-case.js';

const databaseUrl = process.env.DATABASE_URL;
const KEY = 'research-test-key-0123456789abcdef0123';

describe.skipIf(!databaseUrl)('Research dataset export through HTTP with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const learners = Array.from({ length: 12 }, (_, i) => `rd-l${i}-${suffix}`);
  const [admin, plain, ghost] = ['a', 'p', 'g'].map((n) => `rd-${n}-${suffix}`) as [string, string, string];
  const roles: Record<string, 'admin' | 'user'> = { [admin]: 'admin', [plain]: 'user' };
  let app: INestApplication;
  let database: Database;
  const as = (id: string) => ({ authorization: `Bearer ${id}` });
  const get = (id: string, query = '') => request(app.getHttpServer()).get(`/v1/api/admin/research/dataset${query}`).set(as(id));

  beforeAll(async () => {
    database = createDb(databaseUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort)
      .useValue({
        authenticate: async (req: IncomingMessage) => {
          const id = req.headers.authorization?.replace('Bearer ', '');
          return id && id in roles ? { id, email: `${id}@example.test`, name: id, role: roles[id] } : null;
        },
      })
      .overrideProvider(RESEARCH_PSEUDONYM_KEY)
      .useValue(KEY)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    const ids = [...learners, admin, plain];
    await database.insert(users).values(ids.map((id) => ({ id, email: `${id}@example.test`, name: `Real Name ${id}` })));
    await database.insert(learningInteractions).values(
      learners.flatMap((learnerId, l) =>
        Array.from({ length: 5 }, (_, n) => ({
          learnerId,
          sessionId: `coding:${suffix}-${l}-${n}`,
          activityType: 'coding' as const,
          activityId: n,
          occurredAt: new Date(Date.UTC(2026, 0, 1, 0, l, n)),
          elapsedDefinition: 'test',
          contentVersion: '1',
          skills: ['loops'],
          difficulty: 'beginner',
          answers: { code: 'SECRET-CODE' },
          correctness: n % 2 === 0,
          outcome: { status: 'passed', assessed: true },
        })),
      ),
    );
    // A deleted learner's marker exists even if stale rows were somehow left behind.
    await database.insert(deletedUsers).values({ id: ghost });
  });

  afterAll(async () => {
    await app?.close();
    await database.delete(users).where(inArray(users.id, [...learners, admin, plain]));
    await database.delete(deletedUsers).where(inArray(deletedUsers.id, [ghost]));
  });

  it('denies anonymous and non-admin callers', async () => {
    await get('nobody').expect(401);
    await get(plain).expect(403);
  });

  it('rejects invalid parameters', async () => {
    await get(admin, '?limit=0').expect(400);
    await get(admin, '?strategy=random').expect(400);
  });

  it('exports a pseudonymous, deterministic, learner-disjoint dataset', async () => {
    const first = DatasetExportSchema.parse((await get(admin, '?limit=50000').expect(200)).body);
    const second = DatasetExportSchema.parse((await get(admin, '?limit=50000').expect(200)).body);
    const mine = first.rows.filter((r) => r.skills.includes('loops') && r.activityId < 5);
    expect(mine.length).toBeGreaterThanOrEqual(60);
    expect(second.manifest.datasetId).toBe(first.manifest.datasetId);
    expect(second.rows).toEqual(first.rows);
    expect(first.report.learnersInMultipleSplits).toBe(0);

    const text = JSON.stringify(first);
    for (const id of learners) expect(text).not.toContain(id);
    expect(text).not.toContain('Real Name');
    expect(text).not.toContain('@example.test');
    expect(text).not.toContain('SECRET-CODE');
  });

  it('excludes a learner after account deletion', async () => {
    const before = (await get(admin, '?limit=50000').expect(200)).body.rows.length;
    await database.delete(users).where(inArray(users.id, [learners[0]!]));
    const after = (await get(admin, '?limit=50000').expect(200)).body.rows.length;
    expect(after).toBe(before - 5);
  });

  it('produces chronologically separated splits for the time strategy and bounds output', async () => {
    const timed = (await get(admin, '?strategy=time&limit=50000').expect(200)).body;
    expect(timed.report.chronologicallySeparated).toBe(true);
    const bounded = (await get(admin, '?limit=7').expect(200)).body;
    expect(bounded.rows).toHaveLength(7);
    expect(bounded.report.exclusions.truncatedByLimit).toBe(true);
  });
});
