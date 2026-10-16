import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, regions, zones, stages, users } from '@repo/db';

import { CreateQuestUseCase } from './application/create-quest.use-case.js';
import { UpdateQuestUseCase } from './application/update-quest.use-case.js';
import { DrizzleQuestRepository as ContentQuestRepository } from './infrastructure/drizzle-repositories.js';
import { DrizzleStageRepository } from './infrastructure/drizzle-stage.repository.js';
import { StageRepository } from './domain/ports.js';
import { CreateQuestRequestDto } from './presentation/dto/create-quest.dto.js';
import { StartQuestUseCase } from '../quest/application/start-quest.use-case.js';
import { SubmitQuestUseCase } from '../quest/application/submit-quest.use-case.js';
import { ViewQuestResultUseCase } from '../quest/application/view-quest-result.use-case.js';
import { DrizzleQuestRepository } from '../quest/infrastructure/drizzle-quest.repository.js';

const databaseUrl = process.env.QUEST_TEST_DATABASE_URL;
const database = databaseUrl ? createDb(databaseUrl) : null;

describe.skipIf(!database)('authored Quest PostgreSQL flow', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userId = `quest-authoring-${suffix}`;
  let regionId: number;
  let stageId: number;
  let questId: number;
  let contentQuests: ContentQuestRepository;
  let learnerQuests: DrizzleQuestRepository;

  beforeAll(async () => {
    const [region] = await database!
      .insert(regions)
      .values({ name: 'Quest test', slug: `quest-test-${suffix}` })
      .returning();
    regionId = region!.id;
    const [zone] = await database!
      .insert(zones)
      .values({ regionId, name: 'Quest test', slug: `quest-test-${suffix}` })
      .returning();
    const [stage] = await database!
      .insert(stages)
      .values({
        zoneId: zone!.id,
        title: 'Quest test',
        slug: `quest-test-${suffix}`,
      })
      .returning();
    stageId = stage!.id;
    await database!.insert(users).values({
      id: userId,
      email: `${userId}@example.test`,
      name: 'Quest test',
    });
    contentQuests = new ContentQuestRepository(database!);
    learnerQuests = new DrizzleQuestRepository(database!);
  });

  afterAll(async () => {
    if (database) {
      await database.delete(regions).where(eq(regions.id, regionId));
      await database.delete(users).where(eq(users.id, userId));
      await (
        database as unknown as { $client: { end(): Promise<void> } }
      ).$client.end();
    }
  });

  it('creates, edits, starts, submits, and reviews the same persisted questions', async () => {
    const create = new CreateQuestUseCase(
      contentQuests,
      new DrizzleStageRepository(database!) as unknown as StageRepository,
    );
    const quest = await create.execute({
      stageId,
      title: 'Authored quiz',
      passingScore: 100,
      questions: [
        {
          id: 'q1',
          prompt: 'Before edit?',
          options: [
            { id: 'a', text: 'Yes' },
            { id: 'b', text: 'No' },
          ],
          correctOptionId: 'a',
        },
        {
          id: 'q2',
          prompt: 'Second question before edit?',
          options: [
            { id: 'c', text: 'Yes' },
            { id: 'd', text: 'No' },
          ],
          correctOptionId: 'c',
        },
      ],
    });
    questId = quest.id;
    const initialSession = await new StartQuestUseCase(learnerQuests).execute(
      questId,
    );
    const firstQuestionId = initialSession.questions[0]!.id;
    const submit = new SubmitQuestUseCase(
      learnerQuests,
      {} as never,
      {} as never,
      { execute: async () => [] } as never,
    );
    const historicalResult = await submit.execute({
      userId,
      questId,
      responses: initialSession.questions.map((question) => ({
        questionId: question.id,
        optionId: question.options[0]!.id,
      })),
    });

    await new UpdateQuestUseCase(contentQuests).execute(questId, {
      questions: [
        {
          id: 'q1',
          prompt: 'After edit?',
          options: [
            { id: 'a', text: 'Correct' },
            { id: 'b', text: 'Wrong' },
          ],
          correctOptionId: 'a',
        },
      ],
    });
    const historicalReview = await new ViewQuestResultUseCase(
      learnerQuests,
    ).execute(historicalResult.result.id, userId);
    expect(historicalReview.breakdown).toHaveLength(2);
    expect(historicalReview.breakdown[0]?.prompt).toBe('Before edit?');

    const session = await new StartQuestUseCase(learnerQuests).execute(questId);
    expect(session.questions[0]?.id).toBe(firstQuestionId);
    expect(session.questions[0]?.prompt).toBe('After edit?');

    const submission = await submit.execute({
      userId,
      questId,
      responses: [
        {
          questionId: firstQuestionId,
          optionId: session.questions[0]!.options[0]!.id,
        },
      ],
    });
    const review = await new ViewQuestResultUseCase(learnerQuests).execute(
      submission.result.id,
      userId,
    );
    expect(review.breakdown[0]).toMatchObject({
      prompt: 'After edit?',
      isCorrect: true,
      options: [{ text: 'Correct', isCorrect: true }],
    });
  });

  it('rejects an invalid authored answer reference at the request boundary', async () => {
    const dto = plainToInstance(CreateQuestRequestDto, {
      stageId,
      title: 'Invalid quiz',
      questions: [
        {
          id: 'q1',
          prompt: '?',
          options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
          ],
          correctOptionId: 'missing',
        },
      ],
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
