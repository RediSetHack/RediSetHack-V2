import { eq } from 'drizzle-orm';
import { db, regions, zones } from '@repo/db';
import { LessonResponseSchema } from '@repo/contracts';
import { describe, expect, it } from 'vitest';

import { DrizzleStageRepository as AuthorStageRepository } from '../content/infrastructure/drizzle-repositories.js';
import { DrizzleStageRepository as LearnerStageRepository } from '../content/infrastructure/drizzle-stage.repository.js';
import { GetStageLessonUseCase } from './application/get-stage-lesson.use-case.js';
import type { ProgressRepository } from './domain/ports/progress.repository.js';

describe.skipIf(!db)('Lesson blocks PostgreSQL round trip', () => {
  it('preserves every authored block through PostgreSQL and the learner response contract', async () => {
    const database = db!;
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const [region] = await database
      .insert(regions)
      .values({ name: 'Ticket 119', slug: `t119-${suffix}` })
      .returning();
    try {
      const [zone] = await database
        .insert(zones)
        .values({
          regionId: region!.id,
          name: 'Ticket 119',
          slug: `t119-${suffix}`,
        })
        .returning();
      const blocks = [
        { type: 'text', content: 'Loops repeat work.' },
        { type: 'code', language: 'javascript', content: 'console.log(1)' },
        {
          type: 'image',
          url: '/loop.png',
          alt: 'A loop diagram',
          caption: 'Loop',
        },
        {
          type: 'exercise',
          prompt: 'Write a loop.',
          language: 'javascript',
          starterCode: 'let i = 0;',
        },
      ];
      const stage = await new AuthorStageRepository(database).create({
        zoneId: zone!.id,
        title: 'Ticket 119',
        slug: `t119-${suffix}`,
        lessonContent: blocks,
        xpReward: 0,
        sortOrder: 0,
      });

      const lesson = await new GetStageLessonUseCase(
        new LearnerStageRepository(database),
        { startReadingSession: async () => ({ id: 'test-session', startedAt: new Date() }), findActiveReadingSession: async () => null, markCompleted: async () => null } as ProgressRepository,
      ).execute('t119-test-user', stage.id);

      expect(LessonResponseSchema.parse(lesson).blocks).toEqual(blocks);
    } finally {
      await database.delete(regions).where(eq(regions.id, region!.id));
    }
  });
});
