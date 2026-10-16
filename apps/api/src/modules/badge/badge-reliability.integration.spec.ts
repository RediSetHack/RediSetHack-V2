import type { IncomingMessage } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  badgeAwards,
  badgeDefinitions,
  createDb,
  quests,
  regions,
  results,
  stages,
  userProgress,
  users,
  zones,
  type Database,
} from '@repo/db';
import { eq, inArray } from 'drizzle-orm';
import {
  BadgeAwardSchema,
  BadgeDefinitionSchema,
  EarnedBadgeSchema,
} from '@repo/contracts';

import { AppModule } from '../../app.module.js';
import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { EvaluateBadgesUseCase } from './application/evaluate-badges.use-case.js';
import { ProfileRepository } from '../profile/domain/ports/profile.repository.js';

describe('Badge definitions and repeat awards reliability (Issue #120)', () => {
  let app: INestApplication;
  let db: Database;
  let evaluateBadges: EvaluateBadgesUseCase;
  let profileRepo: ProfileRepository;

  const testUserId = 'user_test_badge_reliability';
  const otherUserId = 'user_test_badge_other';

  const fakeClerk: ClerkAuthPort = {
    async authenticate(
      request: IncomingMessage,
    ): Promise<ClerkAuthenticatedUser | null> {
      const auth = request.headers['authorization'];
      if (auth === 'Bearer admin-token') {
        return {
          id: 'admin_test_user',
          email: 'admin@example.com',
          role: 'admin',
          name: 'Admin User',
        };
      }
      if (auth === 'Bearer learner-token') {
        return {
          id: testUserId,
          email: 'learner@example.com',
          role: 'user',
          name: 'Learner User',
        };
      }
      return null;
    },
  };

  const adminAuth = () => ({ Authorization: 'Bearer admin-token' });
  const learnerAuth = () => ({ Authorization: 'Bearer learner-token' });

  let testRegionId: number;
  let testZoneId: number;
  let testStageIds: number[] = [];
  let testQuestId: number;
  let createdBadgeIds: number[] = [];

  beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'DATABASE_URL is required for badge reliability integration test',
      );
    }
    db = createDb(dbUrl);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ClerkAuthPort)
      .useValue(fakeClerk)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    evaluateBadges = moduleRef.get(EvaluateBadgesUseCase);
    profileRepo = moduleRef.get(ProfileRepository);

    // Clean up previous runs if any
    await db.delete(badgeAwards).where(eq(badgeAwards.userId, testUserId));
    await db.delete(userProgress).where(eq(userProgress.userId, testUserId));
    await db.delete(results).where(eq(results.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));

    // Seed test users
    await db
      .insert(users)
      .values([
        { id: testUserId, email: 'learner@example.com', name: 'Learner User' },
        { id: otherUserId, email: 'other@example.com', name: 'Other User' },
      ])
      .onConflictDoNothing();

    // Seed catalog fixtures (region, zone, stages, quest)
    const [region] = await db
      .insert(regions)
      .values({
        name: 'Test Badge Region',
        slug: `badge-region-${Date.now()}`,
        sortOrder: 1,
      })
      .returning();
    testRegionId = region.id;

    const [zone] = await db
      .insert(zones)
      .values({
        regionId: testRegionId,
        name: 'Test Badge Zone',
        slug: `badge-zone-${Date.now()}`,
        sortOrder: 1,
      })
      .returning();
    testZoneId = zone.id;

    const insertedStages = await db
      .insert(stages)
      .values([
        {
          zoneId: testZoneId,
          title: 'Stage 1',
          slug: `stage-1-${Date.now()}`,
          xpReward: 50,
          sortOrder: 1,
        },
        {
          zoneId: testZoneId,
          title: 'Stage 2',
          slug: `stage-2-${Date.now()}`,
          xpReward: 50,
          sortOrder: 2,
        },
        {
          zoneId: testZoneId,
          title: 'Stage 3',
          slug: `stage-3-${Date.now()}`,
          xpReward: 50,
          sortOrder: 3,
        },
        {
          zoneId: testZoneId,
          title: 'Stage 4',
          slug: `stage-4-${Date.now()}`,
          xpReward: 50,
          sortOrder: 4,
        },
      ])
      .returning();
    testStageIds = insertedStages.map((s) => s.id);

    const [quest] = await db
      .insert(quests)
      .values({
        stageId: testStageIds[0],
        title: 'Test Badge Quest',
        timeLimitSeconds: 60,
        passingScore: 70,
        xpReward: 50,
        questionsJson: [],
      })
      .returning();
    testQuestId = quest.id;
  });

  afterAll(async () => {
    if (db) {
      await db.delete(badgeAwards).where(eq(badgeAwards.userId, testUserId));
      await db.delete(userProgress).where(eq(userProgress.userId, testUserId));
      await db.delete(results).where(eq(results.userId, testUserId));
      await db
        .delete(users)
        .where(inArray(users.id, [testUserId, otherUserId]));
      if (createdBadgeIds.length > 0) {
        await db
          .delete(badgeDefinitions)
          .where(inArray(badgeDefinitions.id, createdBadgeIds));
      }
      if (testStageIds.length > 0) {
        await db.delete(quests).where(eq(quests.id, testQuestId));
        await db.delete(stages).where(inArray(stages.id, testStageIds));
      }
      if (testZoneId) {
        await db.delete(zones).where(eq(zones.id, testZoneId));
      }
      if (testRegionId) {
        await db.delete(regions).where(eq(regions.id, testRegionId));
      }
    }
    if (app) {
      await app.close();
    }
  });

  it('validates exact cumulative, activity, and category criteria including Zone identity', async () => {
    // 1. Reject invalid cumulative target
    const resBadCumulative = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(adminAuth())
      .send({
        name: 'Bad Cumulative',
        slug: `bad-cum-${Date.now()}`,
        criteria: { trigger: 'cumulative', target: 'xp', threshold: 100 },
      });
    expect(resBadCumulative.status).toBe(400);

    // 2. Reject non-existent Zone for category completion
    const resMissingZone = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(adminAuth())
      .send({
        name: 'Missing Zone Category',
        slug: `bad-zone-${Date.now()}`,
        criteria: {
          trigger: 'category',
          target: 'zone_completion',
          zoneId: 999999,
        },
      });
    expect(resMissingZone.status).toBe(400);

    // 3. Reject invalid threshold (<= 0 or non-integer)
    const resBadThreshold = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(adminAuth())
      .send({
        name: 'Negative Threshold',
        slug: `neg-thresh-${Date.now()}`,
        criteria: {
          trigger: 'activity',
          target: 'quest_passes',
          threshold: -5,
        },
      });
    expect(resBadThreshold.status).toBe(400);

    // 4. Accept valid cumulative badge (threshold: 2 stage completions)
    const resCumulative = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(adminAuth())
      .send({
        name: 'Two Stage Finisher',
        slug: `two-stage-${Date.now()}`,
        description: 'Completed 2 stages',
        criteria: {
          trigger: 'cumulative',
          target: 'stage_completions',
          threshold: 2,
        },
      });
    expect(resCumulative.status).toBe(201);
    createdBadgeIds.push(resCumulative.body.id);

    // 5. Accept valid activity badge (threshold: 2 quest passes)
    const resActivity = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(adminAuth())
      .send({
        name: 'Double Quizzer',
        slug: `double-quizzer-${Date.now()}`,
        description: 'Passed 2 quests',
        criteria: {
          trigger: 'activity',
          target: 'quest_passes',
          threshold: 2,
        },
      });
    expect(resActivity.status).toBe(201);
    createdBadgeIds.push(resActivity.body.id);

    // 6. Accept valid category badge with verified Zone identity
    const resCategory = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(adminAuth())
      .send({
        name: 'Zone Explorer',
        slug: `zone-explorer-${Date.now()}`,
        description: 'Completed all stages in test zone',
        criteria: {
          trigger: 'category',
          target: 'zone_completion',
          zoneId: testZoneId,
        },
      });
    expect(resCategory.status).toBe(201);
    const parsedCategoryBadge = BadgeDefinitionSchema.parse(resCategory.body);
    expect(parsedCategoryBadge.id).toBeDefined();
    createdBadgeIds.push(resCategory.body.id);
  });

  it('exercises real qualifying activity data with concurrent evaluation and verifies profile counts match stored distinct awards', async () => {
    // Seed real qualifying activity data for the test learner:
    // - 4 stages completed (should qualify for 2 cumulative awards: 4 / 2 = 2)
    // - All 4 stages are in testZoneId (should qualify for 1 category award)
    await db.insert(userProgress).values(
      testStageIds.map((stageId) => ({
        userId: testUserId,
        stageId,
        completed: true,
        completedAt: new Date(),
      })),
    );

    // - 4 quest passes (should qualify for 2 activity awards: 4 / 2 = 2)
    await db.insert(results).values([
      { userId: testUserId, questId: testQuestId, score: 80, passed: true },
      { userId: testUserId, questId: testQuestId, score: 90, passed: true },
      { userId: testUserId, questId: testQuestId, score: 85, passed: true },
      { userId: testUserId, questId: testQuestId, score: 95, passed: true },
    ]);

    // Concurrently trigger badge evaluation 5 times in parallel
    const concurrentResults = await Promise.all([
      evaluateBadges.execute(testUserId),
      evaluateBadges.execute(testUserId),
      evaluateBadges.execute(testUserId),
      evaluateBadges.execute(testUserId),
      evaluateBadges.execute(testUserId),
    ]);

    // Flatten all newly awarded badges across concurrent runs
    const allNewAwards = concurrentResults.flatMap((r) => r);
    // At least one run awarded the badges
    expect(allNewAwards.length).toBeGreaterThanOrEqual(3);

    // Verify distinct awards persisted in database
    const storedAwards = await db
      .select()
      .from(badgeAwards)
      .where(eq(badgeAwards.userId, testUserId));

    // Expected exact awards:
    // - Cumulative: milestone 1, milestone 2 (2 distinct rows)
    // - Activity: milestone 1, milestone 2 (2 distinct rows)
    // - Category: milestone 1 (1 distinct row)
    // Total = 5 rows
    expect(storedAwards).toHaveLength(5);

    // Verify unique milestone integrity per badge
    const awardsByBadge = new Map<number, number[]>();
    for (const award of storedAwards) {
      const list = awardsByBadge.get(award.badgeDefinitionId) ?? [];
      list.push(award.milestone);
      awardsByBadge.set(award.badgeDefinitionId, list);
    }

    const cumulativeBadgeId = createdBadgeIds[0];
    const activityBadgeId = createdBadgeIds[1];
    const categoryBadgeId = createdBadgeIds[2];

    expect(awardsByBadge.get(cumulativeBadgeId)?.sort()).toEqual([1, 2]);
    expect(awardsByBadge.get(activityBadgeId)?.sort()).toEqual([1, 2]);
    expect(awardsByBadge.get(categoryBadgeId)?.sort()).toEqual([1]);

    // Verify profile counts match stored distinct awards
    const profile = await profileRepo.findProfileByUserId(testUserId);
    expect(profile).not.toBeNull();

    const cumulativeProfileBadge = profile?.badges.find(
      (b) => b.badgeDefinitionId === cumulativeBadgeId,
    );
    const activityProfileBadge = profile?.badges.find(
      (b) => b.badgeDefinitionId === activityBadgeId,
    );
    const categoryProfileBadge = profile?.badges.find(
      (b) => b.badgeDefinitionId === categoryBadgeId,
    );

    expect(cumulativeProfileBadge?.count).toBe(2);
    expect(activityProfileBadge?.count).toBe(2);
    expect(categoryProfileBadge?.count).toBe(1);

    // Verify through learner endpoint GET /v1/api/badges/me
    const meRes = await request(app.getHttpServer())
      .get('/v1/api/badges/me')
      .set(learnerAuth());
    expect(meRes.status).toBe(200);

    const meBadges = EarnedBadgeSchema.array().parse(meRes.body);
    const meCumulative = meBadges.find((b) => b.id === cumulativeBadgeId);
    const meActivity = meBadges.find((b) => b.id === activityBadgeId);
    const meCategory = meBadges.find((b) => b.id === categoryBadgeId);

    expect(meCumulative?.count).toBe(2);
    expect(meActivity?.count).toBe(2);
    expect(meCategory?.count).toBe(1);
  });

  it('demonstrates retryable evaluation and recovery path for missed awards via learner and admin operations', async () => {
    // 1. Admin creates a new badge definition with threshold 1 (stage completions)
    // The user already has 4 stage completions, but 0 awards for this new badge (simulating missed award)
    const newBadgeRes = await request(app.getHttpServer())
      .post('/v1/api/admin/badges')
      .set(adminAuth())
      .send({
        name: 'Single Stage Mastery',
        slug: `single-stage-${Date.now()}`,
        description: 'Earned every 1 completed stage',
        criteria: {
          trigger: 'cumulative',
          target: 'stage_completions',
          threshold: 1,
        },
      });
    expect(newBadgeRes.status).toBe(201);
    const newBadgeId = newBadgeRes.body.id;
    createdBadgeIds.push(newBadgeId);

    // Confirm 0 awards currently exist for this new badge
    const initialAwards = await db
      .select()
      .from(badgeAwards)
      .where(eq(badgeAwards.badgeDefinitionId, newBadgeId));
    expect(initialAwards).toHaveLength(0);

    // 2. Learner invokes the recovery endpoint POST /v1/api/badges/evaluate
    const recoverRes = await request(app.getHttpServer())
      .post('/v1/api/badges/evaluate')
      .set(learnerAuth());

    expect(recoverRes.status).toBe(200);
    // Parse response with BadgeAwardSchema contract
    const newlyAwarded = recoverRes.body;
    expect(Array.isArray(newlyAwarded)).toBe(true);
    for (const item of newlyAwarded) {
      expect(() => BadgeAwardSchema.parse(item)).not.toThrow();
    }

    const recoveredBadge = newlyAwarded.find(
      (b: { id: number }) => b.id === newBadgeId,
    );
    expect(recoveredBadge).toBeDefined();
    // 4 stages completed / threshold 1 = 4 repeat awards!
    expect(recoveredBadge.awardCount).toBe(4);

    // 3. Calling recovery again is completely idempotent
    const rerunRes = await request(app.getHttpServer())
      .post('/v1/api/badges/evaluate')
      .set(learnerAuth());
    expect(rerunRes.status).toBe(200);
    expect(rerunRes.body).toEqual([]);

    // 4. Admin recovery endpoint POST /v1/api/admin/badges/evaluate/:userId
    // Non-admin receives 403 Forbidden
    const forbiddenRes = await request(app.getHttpServer())
      .post(`/v1/api/admin/badges/evaluate/${testUserId}`)
      .set(learnerAuth());
    expect(forbiddenRes.status).toBe(403);

    // Admin receives 200 OK (idempotent evaluation)
    const adminRecoverRes = await request(app.getHttpServer())
      .post(`/v1/api/admin/badges/evaluate/${testUserId}`)
      .set(adminAuth());
    expect(adminRecoverRes.status).toBe(200);
    expect(adminRecoverRes.body).toEqual([]);

    // Profile counts correctly show count = 4 for newBadgeId
    const finalProfile = await profileRepo.findProfileByUserId(testUserId);
    const newBadgeProfile = finalProfile?.badges.find(
      (b) => b.badgeDefinitionId === newBadgeId,
    );
    expect(newBadgeProfile?.count).toBe(4);
  });
});
