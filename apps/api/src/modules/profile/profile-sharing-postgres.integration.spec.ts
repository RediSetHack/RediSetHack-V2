import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, ctfChallenges, ctfAttempts, ctfSolves, regions, stages, userProgress, users, zones, type Database } from '@repo/db';
import { ProfileResponseSchema, ProfileSharingSchema, SharedProfileResponseSchema } from '@repo/contracts';
import { AppModule } from '../../app.module.js';
import { ClerkAuthPort } from '../auth/domain/ports/clerk-auth.port.js';

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)('Shareable accomplishment profile through HTTP with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const learner = `share-${suffix}`;
  let app: INestApplication;
  let database: Database;
  let regionId: number;
  const as = { authorization: `Bearer ${learner}` };
  const http = () => request(app.getHttpServer());
  const profile = async () => ProfileResponseSchema.parse((await http().get('/v1/api/users/profile').set(as).expect(200)).body);

  beforeAll(async () => {
    database = createDb(databaseUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort)
      .useValue({
        authenticate: async (req: IncomingMessage) =>
          req.headers.authorization === `Bearer ${learner}` ? { id: learner, email: `${learner}@example.test`, name: 'Private Name', role: 'user' } : null,
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    await database.insert(users).values({ id: learner, email: `${learner}@example.test`, name: 'Private Name', totalXp: 450 });
    const [region] = await database.insert(regions).values({ name: 'Share', slug: `share-${suffix}`, storyIntro: 'Story' }).returning();
    regionId = region!.id;
    const [zone] = await database.insert(zones).values({ regionId, name: 'Z', slug: `share-${suffix}` }).returning();
    const [stage] = await database.insert(stages).values({ zoneId: zone!.id, title: 'Only', slug: `share-${suffix}`, sortOrder: 1 }).returning();
    await database.insert(userProgress).values({ userId: learner, stageId: stage!.id, completed: true, completedAt: new Date() });
    const [challenge] = await database
      .insert(ctfChallenges)
      .values({ stageId: stage!.id, authoringId: `share-${suffix}`, title: 'C', category: 'x', difficulty: 'beginner', brief: 'b', artifactName: 'a', artifact: 'x', flagHash: 'h' })
      .returning();
    const [attempt] = await database.insert(ctfAttempts).values({ learnerId: learner, challengeId: challenge!.id, correct: true }).returning();
    await database.insert(ctfSolves).values({ learnerId: learner, challengeId: challenge!.id, attemptId: attempt!.id });
  });

  afterAll(async () => {
    await database?.delete(users).where(eq(users.id, learner));
    await database?.delete(regions).where(eq(regions.id, regionId));
    await app?.close();
  });

  it('is private by default, with rank and completed evidence in the self profile', async () => {
    const self = await profile();
    expect(self.sharing.shareId).toBeNull();
    expect(self.adventurerRank).toBe(self.level);
    expect(self.accomplishments).toEqual({ novelsCompleted: 1, sideQuestsCompleted: 0, ctfsSolved: 1 });
  });

  it('shares only the approved summary while enabled, then revokes', async () => {
    await http().put('/v1/api/users/profile/sharing').send({ enabled: true }).expect(401);
    await http().put('/v1/api/users/profile/sharing').set(as).send({ enabled: 'yes' }).expect(400);

    const { shareId } = ProfileSharingSchema.parse((await http().put('/v1/api/users/profile/sharing').set(as).send({ enabled: true }).expect(200)).body);
    expect(shareId).not.toBeNull();
    const again = await http().put('/v1/api/users/profile/sharing').set(as).send({ enabled: true });
    expect(again.body.shareId).toBe(shareId); // idempotent: link stays stable

    const publicView = await http().get(`/v1/api/shared-profiles/${shareId}`).expect(200); // no auth
    SharedProfileResponseSchema.strict().parse(publicView.body);
    expect(publicView.body.accomplishments).toEqual({ novelsCompleted: 1, sideQuestsCompleted: 0, ctfsSolved: 1 });
    const text = JSON.stringify(publicView.body);
    for (const secret of [learner, 'example.test', 'Private Name', shareId!]) expect(text).not.toContain(secret);

    await http().put('/v1/api/users/profile/sharing').set(as).send({ enabled: false }).expect(200);
    await http().get(`/v1/api/shared-profiles/${shareId}`).expect(404);
    expect((await profile()).sharing.shareId).toBeNull();
    await http().get('/v1/api/shared-profiles/not-a-uuid').expect(404);
  });

  it('keeps Novel and CTF evidence after content retirement', async () => {
    await database.update(regions).set({ archivedAt: new Date() }).where(eq(regions.id, regionId));
    await database.update(ctfChallenges).set({ archivedAt: new Date() }).where(eq(ctfChallenges.authoringId, `share-${suffix}`));
    expect((await profile()).accomplishments).toEqual({ novelsCompleted: 1, sideQuestsCompleted: 0, ctfsSolved: 1 });
  });
});
