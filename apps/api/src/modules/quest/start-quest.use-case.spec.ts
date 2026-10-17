import { makeAvailableStageRepository } from '../content/fake-stage.fixture.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Quest,
  QuestOption,
  QuestQuestion,
} from './domain/entities/quest.entity.js';
import { QuestNotFoundError } from './domain/errors.js';
import { FakeQuestRepository } from './fake-quest-repository.fixture.js';
import { StartQuestUseCase } from './application/start-quest.use-case.js';
import { QuestPresenter } from './presentation/presenters/quest.presenter.js';
import { QuestSessionResponseSchema } from '@repo/contracts';

const quest = new Quest(1, 10, 'Loops 101', null, 60, 70, 50);
const makeQuestions = () => [
  new QuestQuestion(1, '2 + 2?', [
    new QuestOption(1, '4', true),
    new QuestOption(2, '5', false),
  ]),
];

describe('StartQuestUseCase', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws QuestNotFoundError for a missing quest', async () => {
    const useCase = new StartQuestUseCase(
      new FakeQuestRepository(quest, makeQuestions()),
      makeAvailableStageRepository(),
    );
    await expect(useCase.execute('user_1', 999)).rejects.toBeInstanceOf(
      QuestNotFoundError,
    );
  });

  it('does not start an archived Quest', async () => {
    const archived = new Quest(1, 10, 'Loops 101', null, 60, 70, 50, new Date());
    const useCase = new StartQuestUseCase(
      new FakeQuestRepository(archived, makeQuestions()),
      makeAvailableStageRepository(),
    );
    await expect(useCase.execute('user_1', 1)).rejects.toBeInstanceOf(QuestNotFoundError);
  });

  it('persists an owned session with a snapshot and a server deadline', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00.000Z') });
    const repo = new FakeQuestRepository(quest, makeQuestions());
    const { session } = await new StartQuestUseCase(repo, makeAvailableStageRepository()).execute('user_1', 1);

    expect(session.userId).toBe('user_1');
    expect(session.status).toBe('active');
    expect(session.expiresAt.toISOString()).toBe('2026-09-15T12:01:00.000Z');
    expect(session.questions).toEqual(makeQuestions());
    expect(session.passingScore).toBe(70);
  });

  it('resumes the unexpired session with its original deadline', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00.000Z') });
    const useCase = new StartQuestUseCase(
      new FakeQuestRepository(quest, makeQuestions()),
      makeAvailableStageRepository(),
    );
    const first = await useCase.execute('user_1', 1);
    vi.setSystemTime(new Date('2026-09-15T12:00:30.000Z'));
    const again = await useCase.execute('user_1', 1);

    expect(again.session.id).toBe(first.session.id);
    expect(again.session.expiresAt).toEqual(first.session.expiresAt);
  });

  it('keeps sessions separate per learner', async () => {
    const useCase = new StartQuestUseCase(
      new FakeQuestRepository(quest, makeQuestions()),
      makeAvailableStageRepository(),
    );
    const a = await useCase.execute('user_1', 1);
    const b = await useCase.execute('user_2', 1);
    expect(a.session.id).not.toBe(b.session.id);
  });

  it('closes an abandoned expired session with no credit and starts a fresh one', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00.000Z') });
    const repo = new FakeQuestRepository(quest, makeQuestions());
    const useCase = new StartQuestUseCase(repo, makeAvailableStageRepository());
    const first = await useCase.execute('user_1', 1);
    vi.setSystemTime(new Date('2026-09-15T12:05:00.000Z'));
    const second = await useCase.execute('user_1', 1);

    expect(second.session.id).not.toBe(first.session.id);
    const old = await repo.findSessionById(first.session.id);
    expect(old?.status).toBe('expired');
    expect(repo.results.get(old!.resultId!)).toMatchObject({
      score: 0,
      passed: false,
    });
  });

  it('starts a new session (retake) once the last one is submitted', async () => {
    const repo = new FakeQuestRepository(quest, makeQuestions());
    const useCase = new StartQuestUseCase(repo, makeAvailableStageRepository());
    const first = await useCase.execute('user_1', 1);
    await repo.finalizeSession({
      sessionId: first.session.id,
      status: 'submitted',
      score: 100,
      passed: true,
      responses: [],
    });
    const retake = await useCase.execute('user_1', 1);
    expect(retake.session.id).not.toBe(first.session.id);
  });

  it('snapshots questions at start, unaffected by later edits', async () => {
    const repo = new FakeQuestRepository(quest, makeQuestions());
    const { session } = await new StartQuestUseCase(repo, makeAvailableStageRepository()).execute('user_1', 1);
    repo.questions = [];
    expect(session.questions).toHaveLength(1);
  });
});

describe('QuestPresenter.toSession (answer concealment)', () => {
  const started = async () => {
    const repo = new FakeQuestRepository(quest, makeQuestions());
    return new StartQuestUseCase(repo, makeAvailableStageRepository()).execute('user_1', 1);
  };

  it('withholds isCorrect from every option', async () => {
    const response = QuestPresenter.toSession(await started());
    for (const question of response.questions) {
      for (const option of question.options) {
        expect(option).not.toHaveProperty('isCorrect');
      }
    }
  });

  it('exposes the session id, Quest id, deadline and server time as ISO timestamps', async () => {
    const response = QuestPresenter.toSession(await started());
    expect(response.id).toBe(1);
    expect(response.questId).toBe(1);
    expect(new Date(response.expiresAt).toISOString()).toBe(response.expiresAt);
    expect(new Date(response.serverTime).toISOString()).toBe(response.serverTime);
  });

  it('shows authored objectives and difficulty without exposing answers', async () => {
    const repo = new FakeQuestRepository(quest, [
      new QuestQuestion(1, 'Validate input?', [
        new QuestOption(1, 'Yes', true),
        new QuestOption(2, 'No', false),
      ], ['security.input-validation'], 'intermediate'),
    ]);
    const response = QuestSessionResponseSchema.parse(QuestPresenter.toSession(
      await new StartQuestUseCase(repo, makeAvailableStageRepository()).execute('user_1', 1),
    ));

    expect(response.questions[0]).toMatchObject({
      competencies: [{ id: 'security.input-validation', objective: 'Validate untrusted input before using it.' }],
      difficulty: 'intermediate',
    });
    expect(response.questions[0]?.options[0]).not.toHaveProperty('isCorrect');
  });
});
