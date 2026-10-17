import { createHmac, randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDb,
  deletedUsers,
  quests,
  regions,
  results,
  stages,
  users,
  userProgress,
  zones,
  type Database,
} from '@repo/db';

import { AppModule } from '../../app.module.js';
import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from './domain/ports/clerk-auth.port.js';
import { CLERK_WEBHOOK_SECRET } from './presentation/controllers/clerk-webhook.controller.js';

const dbUrl = process.env.DATABASE_URL;
const key = randomBytes(32);
const signingSecret = `whsec_${key.toString('base64')}`;

function signedEvent(type: string, data: Record<string, unknown>, id: string) {
  const body = JSON.stringify({ type, data });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${body}`)
    .digest('base64');
  return {
    body,
    headers: {
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': `v1,${signature}`,
    },
  };
}

describe.skipIf(!dbUrl)('Clerk account deletion with PostgreSQL', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userId = `delete-user-${suffix}`;
  let app: INestApplication;
  let db: Database;
  let regionId: number;
  let stageId: number;
  const session: ClerkAuthenticatedUser = {
    id: userId,
    email: `${userId}@example.test`,
    name: 'Learner',
    role: 'user',
  };
  const staleIdentity = {
    id: userId,
    email_addresses: [{ id: 'email_1', email_address: session.email }],
    primary_email_address_id: 'email_1',
    first_name: 'Learner',
  };

  beforeAll(async () => {
    db = createDb(dbUrl!);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ClerkAuthPort)
      .useValue({
        async authenticate(req: IncomingMessage) {
          return req.headers.authorization === 'Bearer old-session'
            ? session
            : null;
        },
      })
      .overrideProvider(CLERK_WEBHOOK_SECRET)
      .useValue(signingSecret)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    await db
      .insert(users)
      .values({ id: userId, email: session.email!, name: 'Learner' });
    const [region] = await db
      .insert(regions)
      .values({ name: 'Deletion test', slug: `delete-${suffix}` })
      .returning();
    regionId = region!.id;
    const [zone] = await db
      .insert(zones)
      .values({ regionId, name: 'Deletion test', slug: `delete-${suffix}` })
      .returning();
    const [stage] = await db
      .insert(stages)
      .values({
        zoneId: zone!.id,
        title: 'Deletion test',
        slug: `delete-${suffix}`,
      })
      .returning();
    stageId = stage!.id;
    const [quest] = await db
      .insert(quests)
      .values({ stageId, title: 'Deletion test' })
      .returning();
    await db
      .insert(results)
      .values({ userId, questId: quest!.id, score: 100, passed: true });
    await db.insert(userProgress).values({ userId, stageId, completed: true });
  });

  afterAll(async () => {
    await app?.close();
    if (db) {
      await db.delete(deletedUsers).where(eq(deletedUsers.id, userId));
      await db.delete(regions).where(eq(regions.id, regionId));
      await (
        db as unknown as { $client: { end(): Promise<void> } }
      ).$client.end();
    }
  });

  it('deletes persisted learning data once and ignores duplicate or delayed signed events', async () => {
    const deletion = signedEvent('user.deleted', { id: userId }, 'msg_deleted');
    const first = await request(app.getHttpServer())
      .post('/v1/api/clerk/webhook')
      .set(deletion.headers)
      .send(deletion.body);
    expect(first.status).toBe(201);
    expect(
      await db.query.users.findFirst({ where: eq(users.id, userId) }),
    ).toBeUndefined();
    expect(
      await db.select().from(results).where(eq(results.userId, userId)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId)),
    ).toHaveLength(0);
    expect(
      await db.select().from(deletedUsers).where(eq(deletedUsers.id, userId)),
    ).toHaveLength(1);

    const duplicate = signedEvent(
      'user.deleted',
      { id: userId },
      'msg_deleted_duplicate',
    );
    expect(
      (
        await request(app.getHttpServer())
          .post('/v1/api/clerk/webhook')
          .set(duplicate.headers)
          .send(duplicate.body)
      ).status,
    ).toBe(201);
    for (const [type, msgId] of [
      ['user.created', 'msg_old_create'],
      ['user.updated', 'msg_old_update'],
    ]) {
      const stale = signedEvent(type, staleIdentity, msgId);
      expect(
        (
          await request(app.getHttpServer())
            .post('/v1/api/clerk/webhook')
            .set(stale.headers)
            .send(stale.body)
        ).status,
      ).toBe(201);
    }
    expect(
      await db.query.users.findFirst({ where: eq(users.id, userId) }),
    ).toBeUndefined();
    const sync = await request(app.getHttpServer())
      .post('/v1/api/user/sync')
      .set('authorization', 'Bearer old-session')
      .send({});
    expect(sync.status).toBe(401);
    expect(
      await db.query.users.findFirst({ where: eq(users.id, userId) }),
    ).toBeUndefined();
  });
});
