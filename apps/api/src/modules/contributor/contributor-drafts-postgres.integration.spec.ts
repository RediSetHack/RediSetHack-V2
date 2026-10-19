import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { contributorDrafts, createDb, regions, users, zones, type Database } from '@repo/db';
import { ContributorDraftListResponseSchema, ContributorDraftSchema } from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('Contributor drafts through HTTP with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [owner, other, learner] = ['o', 'p', 'l'].map((n) => `cd-${n}-${suffix}`) as [string, string, string];
  const roles: Record<string, 'contributor' | 'user'> = { [owner]: 'contributor', [other]: 'contributor', [learner]: 'user' };
  let app: INestApplication;
  let database: Database;
  let regionId: number;
  let zoneId: number;
  const as = (id: string) => ({ authorization: `Bearer ${id}` });
  const http = () => request(app.getHttpServer());
  const api = (path = '') => `/v1/api/contributor/drafts${path}`;
  const body = { title: 'Loops', lessonContent: [{ type: 'text', content: 'Hello' }] };
  const create = async (extra = {}) => (await http().post(api()).set(as(owner)).send({ zoneId, ...body, ...extra }).expect(201)).body;

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
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await database.insert(users).values(Object.keys(roles).map((id) => ({ id, email: `${id}@example.test`, name: id })));
    const [region] = await database.insert(regions).values({ name: 'CD', slug: `cd-${suffix}` }).returning();
    regionId = region!.id;
    const [zone] = await database.insert(zones).values({ regionId, name: 'CD', slug: `cd-${suffix}` }).returning();
    zoneId = zone!.id;
  });

  afterAll(async () => {
    await app?.close();
    if (database) {
      await database.delete(regions).where(eq(regions.id, regionId)); // cascades zones and drafts
      for (const id of Object.keys(roles)) await database.delete(users).where(eq(users.id, id));
      await (database as unknown as { $client: { end(): Promise<void> } }).$client.end();
    }
  });

  it('lets the owner create, list, revise and submit a draft; submitted revisions are immutable', async () => {
    const draft = ContributorDraftSchema.parse(await create());
    expect(draft).toMatchObject({ status: 'draft', revision: 1, submittedRevision: null, zoneId });

    const list = await http().get(api()).set(as(owner)).expect(200);
    expect(ContributorDraftListResponseSchema.parse(list.body).map((d) => d.id)).toContain(draft.id);

    const revised = await http().put(api(`/${draft.id}`)).set(as(owner)).send({ revision: 1, title: 'Loops 2', lessonContent: body.lessonContent }).expect(200);
    expect(ContributorDraftSchema.parse(revised.body)).toMatchObject({ title: 'Loops 2', revision: 2 });

    const submitted = await http().post(api(`/${draft.id}/submit`)).set(as(owner)).send({ revision: 2 }).expect(201);
    expect(ContributorDraftSchema.parse(submitted.body)).toMatchObject({ status: 'submitted', revision: 2, submittedRevision: 2 });

    await http().put(api(`/${draft.id}`)).set(as(owner)).send({ revision: 2, ...body }).expect(409);
    await http().post(api(`/${draft.id}/submit`)).set(as(owner)).send({ revision: 2 }).expect(409);
    const [row] = await database.select().from(contributorDrafts).where(eq(contributorDrafts.id, draft.id));
    expect(row).toMatchObject({ title: 'Loops 2', revision: 2, status: 'submitted' });
  });

  it('denies other contributors and learners, and never exposes drafts to learner APIs', async () => {
    const draft = await create({ title: 'Secret draft title' });
    await http().get(api(`/${draft.id}`)).set(as(other)).expect(403);
    await http().put(api(`/${draft.id}`)).set(as(other)).send({ revision: 1, ...body }).expect(403);
    await http().post(api(`/${draft.id}/submit`)).set(as(other)).send({ revision: 1 }).expect(403);
    expect((await http().get(api()).set(as(other)).expect(200)).body).toEqual([]);
    await http().get(api()).set(as(learner)).expect(403);
    await http().get(api()).expect(401);

    const stages = await http().get(`/v1/api/zones/${zoneId}/stages`).set(as(learner));
    expect(JSON.stringify(stages.body)).not.toContain('Secret draft title');
    expect([404, 200]).toContain(stages.status);
  });

  it('rejects a stale revision and lets only one of two concurrent writes win', async () => {
    const draft = await create();
    await http().put(api(`/${draft.id}`)).set(as(owner)).send({ revision: 1, ...body }).expect(200);
    await http().put(api(`/${draft.id}`)).set(as(owner)).send({ revision: 1, ...body }).expect(409);
    await http().post(api(`/${draft.id}/submit`)).set(as(owner)).send({ revision: 1 }).expect(409);

    const racing = await create();
    const results = await Promise.all([
      http().put(api(`/${racing.id}`)).set(as(owner)).send({ revision: 1, ...body }),
      http().put(api(`/${racing.id}`)).set(as(owner)).send({ revision: 1, ...body }),
      http().post(api(`/${racing.id}/submit`)).set(as(owner)).send({ revision: 1 }),
    ]);
    expect(results.filter((r) => r.status < 300)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(2);
  });

  it('gives field-level validation feedback and keeps parents consistent', async () => {
    const bad = await http().post(api()).set(as(owner)).send({ zoneId, title: ' ', lessonContent: [{ type: 'text', content: '' }, { type: 'image', url: 'x', alt: '' }] }).expect(400);
    expect(bad.body.issues.map((i: { path: string }) => i.path)).toEqual(expect.arrayContaining(['title', 'lessonContent.0.content']));
    await http().post(api()).set(as(owner)).send({ zoneId: 999999999, ...body }).expect(404);
    const exercise = [{ type: 'exercise', prompt: 'Do it', language: 'python', starterCode: '', activityId: 999999999 }];
    await http().post(api()).set(as(owner)).send({ zoneId, title: 'T', lessonContent: exercise }).expect(400);
  });
});
