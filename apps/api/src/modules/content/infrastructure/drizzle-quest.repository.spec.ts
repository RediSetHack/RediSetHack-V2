import { describe, expect, it, vi } from 'vitest';
import type { Database } from '@repo/db';

import { DrizzleQuestRepository } from './drizzle-repositories.js';

describe('DrizzleQuestRepository.findAll', () => {
  it('groups authoring questions and options under each quest', async () => {
    const repository = new DrizzleQuestRepository({
      query: {
        quests: {
          findMany: vi
            .fn()
            .mockResolvedValue([
              {
                id: 1,
                stageId: 2,
                title: 'Quiz',
                description: null,
                timeLimitSeconds: 90,
                passingScore: 70,
                xpReward: 10,
                archivedAt: null,
                initialAssessment: false,
              },
            ]),
        },
        questQuestions: {
          findMany: vi
            .fn()
            .mockResolvedValue([
              {
                id: 3,
                questId: 1,
                authoringId: 'question-id',
                prompt: 'Pick one',
                competencyIds: [],
                difficulty: null,
              },
            ]),
        },
        questOptions: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: 4,
              questionId: 3,
              authoringId: 'option-a',
              text: 'A',
              isCorrect: true,
            },
            {
              id: 5,
              questionId: 3,
              authoringId: 'option-b',
              text: 'B',
              isCorrect: false,
            },
          ]),
        },
      },
    } as unknown as Database);

    const quests = await repository.findAll();

    expect(quests).toHaveLength(1);
    expect(quests[0]?.questions).toEqual([
      {
        id: 'question-id',
        prompt: 'Pick one',
        competencyIds: [],
        difficulty: null,
        options: [
          { id: 'option-a', text: 'A' },
          { id: 'option-b', text: 'B' },
        ],
        correctOptionId: 'option-a',
      },
    ]);
  });
});
