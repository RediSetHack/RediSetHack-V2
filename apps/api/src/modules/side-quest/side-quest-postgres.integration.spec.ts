import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  badgeAwards,
  badgeDefinitions,
  codingActivities,
  codingAttempts,
  createDb,
  ctfChallenges,
  learningInteractions,
  regions,
  sideQuestCompletions,
  sideQuests,
  stages,
  userProgress,
  users,
  zones,
  type Database,
} from '@repo/db';
import {
  SideQuestListResponseSchema,
  SideQuestResponseSchema,
  SideQuestStartResponseSchema,
  SideQuestSubmissionResponseSchema,
} from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';
import { CodeExecutionPort } from '../codelab/domain/ports/code-execution.port.js';
import { DailyEventRepository } from '../daily-event/domain/ports/daily-event.repository.js';
import { DailyEvent } from '../daily-event/domain/entities/daily-event.entity.js';

const databaseUrl = process.env.DATABASE_URL;
const FLAG = 'RSH{side_quest_flag}';

describe.skipIf(!databaseUrl)('Side Quests through HTTP with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [fresh, ready, racer, coder] = ['f', 'r', 'x', 'c'].map((n) => `sq-${n}-${suffix}`) as [string, string, string, string];
  let app: INestApplication;
  let database: Database;
  let regionId: number;
  let stage1: number;
  let stage2: number;
  let ids: { open: number; gated: number; skill: number; coding: number; archived: number };
  const as = (id: string) => ({ authorization: `Bearer ${id}` });
  const http = () => request(app.getHttpServer());
  const api = (path = '') => `/v1/api/side-quests${path}`;
  const totalXp = async (id: string) => (await database.select().from(users).where(eq(users.id, id)))[0]!.totalXp;

  beforeAll(async () => {
    database = createDb(databaseUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort)
      .useValue({
        authenticate: async (req: IncomingMessage) => {
          const id = req.headers.authorization?.replace('Bearer ', '');
          return id && [fresh, ready, racer, coder].includes(id) ? { id, email: `${id}@example.test`, name: id, role: 'user' } : null;
        },
      })
      .overrideProvider(DailyEventRepository)
      .useValue({ findByDate: async () => new DailyEvent(1, '2026-10-17', 'normal', 1) })
      .overrideProvider(CodeExecutionPort)
      .useValue({
        execute: async ({ code }: { code: string }) => ({
          stdout: code.includes('good') ? 'OK' : 'NO',
          stderr: '',
          exitCode: 0,
          executionTimeMs: 1,
          requestDurationMs: 1,
          failureType: 'none',
        }),
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    await database.insert(users).values(
      [fresh, ready, racer, coder].map((id) => ({ id, email: `${id}@example.test`, name: id, totalXp: id === ready ? 100 : 0 })),
    );
    const [region] = await database.insert(regions).values({ name: 'SQ', slug: `sq-${suffix}`, storyIntro: 'Once upon a time' }).returning();
    regionId = region!.id;
    const [zone] = await database.insert(zones).values({ regionId, name: 'SQ', slug: `sq-${suffix}` }).returning();
    const [s1, s2] = await database
      .insert(stages)
      .values([
        { zoneId: zone!.id, title: 'First', slug: `a-${suffix}`, sortOrder: 10 },
        { zoneId: zone!.id, title: 'Second', slug: `b-${suffix}`, sortOrder: 20 },
      ])
      .returning();
    stage1 = s1!.id;
    stage2 = s2!.id;
    const [challenge, archivedChallenge] = await database
      .insert(ctfChallenges)
      .values(
        [`c-${suffix}`, `arch-${suffix}`].map((authoringId, i) => ({
          stageId: stage1,
          authoringId,
          title: 'Log',
          category: 'forensics',
          difficulty: 'beginner',
          competencyIds: ['programming.control-flow'],
          brief: 'Inspect.',
          artifactName: 'a.log',
          artifact: 'x',
          flagHash: createHash('sha256').update(FLAG).digest('hex'),
          xpReward: 0,
          archivedAt: i === 1 ? new Date() : null,
        })),
      )
      .returning();
    const [activity] = await database
      .insert(codingActivities)
      .values({
        stageId: stage1,
        authoringId: `code-${suffix}`,
        title: 'Say OK',
        prompt: 'Print OK',
        language: 'python',
        visibleExamples: [{ input: '', expected: 'OK' }],
        passingScore: 100,
        xpReward: 0,
      })
      .returning();
    const [badge] = await database
      .insert(badgeDefinitions)
      .values({ name: 'SQ', slug: `sq-badge-${suffix}`, criteriaJson: { trigger: 'category', target: 'zone_completion', zoneId: -1 } }) // never auto-awards, so other suites' badge evaluation is unaffected
      .returning();

    const base = { summary: 's', brief: 'The objective body', contentVersion: '1' };
    const rows = await database
      .insert(sideQuests)
      .values([
        { ...base, authoringId: `open-${suffix}`, title: 'Open', activityType: 'ctf', activityId: challenge!.id, xpReward: 15, prerequisites: [] },
        {
          ...base,
          authoringId: `gated-${suffix}`,
          title: 'Gated',
          activityType: 'ctf',
          activityId: challenge!.id,
          xpReward: 15,
          prerequisites: [
            { type: 'level', minLevel: 2 },
            { type: 'badge', badgeSlug: badge!.slug },
            { type: 'novel', regionSlug: region!.slug },
            { type: 'activity', activityType: 'coding', activityId: activity!.id },
          ],
        },
        { ...base, authoringId: `skill-${suffix}`, title: 'Skill', activityType: 'ctf', activityId: challenge!.id, xpReward: 5, prerequisites: [{ type: 'skill', skillId: 'programming.control-flow', minScore: 1 }] },
        { ...base, authoringId: `coding-${suffix}`, title: 'Coding', activityType: 'coding', activityId: activity!.id, xpReward: 20, prerequisites: [] },
        { ...base, authoringId: `arch-${suffix}`, title: 'Archived', activityType: 'ctf', activityId: archivedChallenge!.id, prerequisites: [] },
      ])
      .returning();
    ids = { open: rows[0]!.id, gated: rows[1]!.id, skill: rows[2]!.id, coding: rows[3]!.id, archived: rows[4]!.id };

    // `ready` meets every clause of the gated Side Quest.
    await database.insert(badgeAwards).values({ userId: ready, badgeDefinitionId: badge!.id });
    await database.insert(userProgress).values([stage1, stage2].map((stageId) => ({ userId: ready, stageId, completed: true, completedAt: new Date() })));
    await database.insert(codingAttempts).values({
      learnerId: ready,
      activityId: activity!.id,
      code: 'good',
      score: 100,
      passed: true,
      errorCategory: 'none',
      checksPassed: 1,
      checksTotal: 1,
      elapsedMs: 1,
    });
  });

  afterAll(async () => {
    await app?.close();
    if (database) {
      await database.delete(sideQuests).where(inArray(sideQuests.id, Object.values(ids ?? {})));
      await database.delete(regions).where(eq(regions.id, regionId));
      await database.delete(badgeDefinitions).where(eq(badgeDefinitions.slug, `sq-badge-${suffix}`));
      await database.delete(codingActivities).where(eq(codingActivities.authoringId, `code-${suffix}`));
      await database.delete(ctfChallenges).where(inArray(ctfChallenges.authoringId, [`c-${suffix}`, `arch-${suffix}`]));
      for (const id of [fresh, ready, racer, coder]) await database.delete(users).where(eq(users.id, id));
      await (database as unknown as { $client: { end(): Promise<void> } }).$client.end();
    }
  });

  it('lists locked Side Quests with actionable reasons and withholds the body from the detail', async () => {
    const list = await http().get(api()).set(as(fresh)).expect(200);
    SideQuestListResponseSchema.parse(list.body);
    const byId = new Map<number, { status: string; lockReasons: { type: string }[] }>(list.body.map((q: { id: number }) => [q.id, q]));
    expect(byId.get(ids.open)).toMatchObject({ status: 'available', lockReasons: [] });
    expect(byId.get(ids.gated)!.status).toBe('locked');
    expect(byId.get(ids.gated)!.lockReasons.map((r) => r.type).sort()).toEqual(['activity', 'badge', 'level', 'novel']);
    expect(byId.has(ids.archived)).toBe(false);

    const detail = await http().get(api(`/${ids.gated}`)).set(as(fresh)).expect(200);
    SideQuestResponseSchema.parse(detail.body);
    expect(detail.body).toMatchObject({ brief: null, activity: null, status: 'locked' });
    expect(detail.body.requirements).toHaveLength(4);
    const open = await http().get(api(`/${ids.open}`)).set(as(fresh)).expect(200);
    expect(open.body.brief).toBe('The objective body');
  });

  it('rejects direct start and submit of a locked Side Quest, with reasons and no side effects', async () => {
    const start = await http().post(api(`/${ids.gated}/start`)).set(as(fresh)).expect(403);
    expect(start.body.lockReasons).toHaveLength(4);
    const submit = await http().post(api(`/${ids.gated}/submissions`)).set(as(fresh)).send({ flag: FLAG }).expect(403);
    expect(submit.body.lockReasons).toHaveLength(4);
    expect(await database.select().from(sideQuestCompletions).where(eq(sideQuestCompletions.learnerId, fresh))).toEqual([]);
    expect(await totalXp(fresh)).toBe(0);
    await http().get(api()).expect(401);
    await http().get(api('/999999')).set(as(fresh)).expect(404);
    await http().get(api(`/${ids.archived}`)).set(as(fresh)).expect(404);
  });

  it('keeps skill-gated Side Quests locked while skill estimates are unknown', async () => {
    const detail = await http().get(api(`/${ids.skill}`)).set(as(ready)).expect(200);
    expect(detail.body.status).toBe('locked');
    expect(detail.body.lockReasons[0].type).toBe('skill');
    await http().post(api(`/${ids.skill}/start`)).set(as(ready)).expect(403);
  });

  it('unlocks for an eligible learner, requires a start, and records one completion exactly once', async () => {
    const detail = await http().get(api(`/${ids.gated}`)).set(as(ready)).expect(200);
    expect(detail.body).toMatchObject({ status: 'available', lockReasons: [], activity: { type: 'ctf' } });

    await http().post(api(`/${ids.gated}/submissions`)).set(as(ready)).send({ flag: FLAG }).expect(409);
    const start = await http().post(api(`/${ids.gated}/start`)).set(as(ready)).expect(201);
    SideQuestStartResponseSchema.parse(start.body);
    const again = await http().post(api(`/${ids.gated}/start`)).set(as(ready)).expect(201);
    expect(again.body.startedAt).toBe(start.body.startedAt);
    await http().post(api(`/${ids.gated}/submissions`)).set(as(ready)).send({}).expect(400);

    const wrong = await http().post(api(`/${ids.gated}/submissions`)).set(as(ready)).send({ flag: 'RSH{no}' }).expect(201);
    SideQuestSubmissionResponseSchema.parse(wrong.body);
    expect(wrong.body).toEqual({ passed: false, completed: false, alreadyCompleted: false, xpAwarded: 0 });
    expect(await totalXp(ready)).toBe(100);

    const done = await http().post(api(`/${ids.gated}/submissions`)).set(as(ready)).send({ flag: FLAG }).expect(201);
    expect(done.body).toEqual({ passed: true, completed: true, alreadyCompleted: false, xpAwarded: 15 });
    expect(await totalXp(ready)).toBe(115);
    const [completion] = await database.select().from(sideQuestCompletions).where(eq(sideQuestCompletions.learnerId, ready));
    expect(completion).toMatchObject({ sideQuestId: ids.gated, xpAwarded: 15 });
    const [event] = await database.select().from(learningInteractions).where(eq(learningInteractions.id, completion!.eventId!));
    expect(event).toMatchObject({ activityType: 'side_quest', activityId: ids.gated, learnerId: ready, correctness: true });

    // Replay: the original outcome stands; nothing is paid or logged twice.
    const replay = await http().post(api(`/${ids.gated}/submissions`)).set(as(ready)).send({ flag: FLAG }).expect(201);
    expect(replay.body).toEqual({ passed: true, completed: true, alreadyCompleted: true, xpAwarded: 0 });
    expect(await totalXp(ready)).toBe(115);
    expect(await database.select().from(sideQuestCompletions).where(eq(sideQuestCompletions.learnerId, ready))).toHaveLength(1);
    const events = await database.select().from(learningInteractions).where(eq(learningInteractions.learnerId, ready));
    expect(events.filter((e) => e.activityType === 'side_quest')).toHaveLength(1);
    const list = await http().get(api()).set(as(ready)).expect(200);
    expect(list.body.find((q: { id: number }) => q.id === ids.gated).status).toBe('completed');
  });

  it('credits a concurrent double submission once', async () => {
    await http().post(api(`/${ids.open}/start`)).set(as(racer)).expect(201);
    const sends = await Promise.all([1, 2, 3].map(() => http().post(api(`/${ids.open}/submissions`)).set(as(racer)).send({ flag: FLAG })));
    expect(sends.map((r) => r.status).filter((s) => s === 201).length).toBeGreaterThan(0);
    expect(await totalXp(racer)).toBe(15);
    expect(await database.select().from(sideQuestCompletions).where(eq(sideQuestCompletions.learnerId, racer))).toHaveLength(1);
  });

  it('completes a Side Quest that designates a coding activity', async () => {
    await http().post(api(`/${ids.coding}/start`)).set(as(coder)).expect(201);
    const bad = await http().post(api(`/${ids.coding}/submissions`)).set(as(coder)).send({ code: 'bad' }).expect(201);
    expect(bad.body.passed).toBe(false);
    const good = await http().post(api(`/${ids.coding}/submissions`)).set(as(coder)).send({ code: 'good' }).expect(201);
    expect(good.body).toEqual({ passed: true, completed: true, alreadyCompleted: false, xpAwarded: 20 });
    expect(await totalXp(coder)).toBe(20);
  });

  it('never blocks the main story: an unfinished locked Side Quest does not gate Stage completion', async () => {
    const before = await database.select().from(userProgress).where(eq(userProgress.userId, fresh));
    expect(before).toEqual([]);
    await http().post(`/v1/api/stages/${stage1}/complete`).set(as(fresh)).expect((r) => expect(r.status).toBeLessThan(300));
    await http().post(`/v1/api/stages/${stage2}/complete`).set(as(fresh)).expect((r) => expect(r.status).toBeLessThan(300));
    expect((await database.select().from(userProgress).where(eq(userProgress.userId, fresh))).filter((p) => p.completed)).toHaveLength(2);
  });
});
