import { StageRepository } from '../../content/domain/ports/stage.repository.js';
import { assertStageAccess } from '../../progress/application/stage-access.js';

import { Injectable, Logger } from '@nestjs/common';

import {
  EvaluateBadgesUseCase,
  type BadgeAwardResult,
} from '../../badge/application/evaluate-badges.use-case.js';
import { GetTodayEventUseCase } from '../../daily-event/application/get-today-event.use-case.js';
import { QuestQuestion } from '../domain/entities/quest.entity.js';
import {
  QuestResult,
  type QuestResponse,
} from '../domain/entities/quest-result.entity.js';
import { QuestSession } from '../domain/entities/quest-session.entity.js';
import {
  InvalidQuestResponsesError,
  QuestNotFoundError,
  QuestSessionAlreadySubmittedError,
  QuestSessionNotFoundError,
} from '../domain/errors.js';
import { QuestRepository } from '../domain/ports/quest.repository.js';

export type SubmitQuestInput = {
  userId: string;
  questId: number;
  sessionId: number;
  responses: QuestResponse[];
};

export type SubmitQuestOutput = {
  result: QuestResult;
  xpAwarded: number;
  badgesEarned: BadgeAwardResult[];
  outcome: 'submitted' | 'expired';
};

function validateResponses(
  questions: QuestQuestion[],
  responses: QuestResponse[],
): void {
  const seen = new Set<number>();
  for (const response of responses) {
    const question = questions.find((q) => q.id === response.questionId);
    if (!question) {
      throw new InvalidQuestResponsesError(
        `question ${response.questionId} is not part of this session`,
      );
    }
    if (seen.has(response.questionId)) {
      throw new InvalidQuestResponsesError(
        `question ${response.questionId} was answered more than once`,
      );
    }
    seen.add(response.questionId);
    if (!question.options.some((o) => o.id === response.optionId)) {
      throw new InvalidQuestResponsesError(
        `option ${response.optionId} does not belong to question ${response.questionId}`,
      );
    }
  }
}

function canonical(responses: QuestResponse[]): string {
  return JSON.stringify(
    responses
      .map((r) => [r.questionId, r.optionId])
      .sort((a, b) => a[0]! - b[0]!),
  );
}

function scorePercent(
  questions: QuestQuestion[],
  responses: QuestResponse[],
): number {
  if (questions.length === 0) return 0;

  const chosenByQuestion = new Map(
    responses.map((r) => [r.questionId, r.optionId]),
  );
  const correctCount = questions.filter((question) => {
    const chosenOptionId = chosenByQuestion.get(question.id);
    const correctOption = question.options.find((option) => option.isCorrect);
    return chosenOptionId !== undefined && correctOption?.id === chosenOptionId;
  }).length;

  return Math.round((correctCount / questions.length) * 100);
}

@Injectable()
export class SubmitQuestUseCase {
  private readonly logger = new Logger(SubmitQuestUseCase.name);

  constructor(
    private readonly quests: QuestRepository,
    private readonly getTodayEvent: GetTodayEventUseCase,
    private readonly evaluateBadges: EvaluateBadgesUseCase,
    private readonly stages: StageRepository,
  ) {}

  async execute(input: SubmitQuestInput): Promise<SubmitQuestOutput> {
    const quest = await this.quests.findById(input.questId);
    if (!quest) {
      throw new QuestNotFoundError(input.questId);
    }

    await assertStageAccess(this.stages, input.userId, quest.stageId);

    // Not found, not-owned, and wrong-Quest are indistinguishable to the
    // requester, matching Result review.
    const session = await this.quests.findSessionById(input.sessionId);
    if (session?.userId !== input.userId || session.questId !== input.questId) {
      throw new QuestSessionNotFoundError(input.sessionId);
    }
    if (session.status !== 'active') {
      return this.replay(session, input.responses);
    }

    // Expiry is judged on the server clock against the persisted deadline:
    // a late submission is recorded with no credit and no grace period.
    const expired = Date.now() >= session.expiresAt.getTime();
    if (!expired) validateResponses(session.questions, input.responses);

    const score = expired
      ? 0
      : scorePercent(session.questions, input.responses);
    const passed = !expired && score >= session.passingScore;
    const xpToAward =
      passed && quest.xpReward > 0
        ? quest.xpReward * (await this.getTodayEvent.execute()).xpMultiplier
        : 0;
    const finalized = await this.quests.finalizeSession({
      sessionId: session.id,
      status: expired ? 'expired' : 'submitted',
      score,
      passed,
      responses: expired ? [] : input.responses,
      xpToAward,
    });
    if (!finalized) {
      // Lost a race with a concurrent submission of the same session.
      const settled = await this.quests.findSessionById(session.id);
      return this.replay(settled!, input.responses);
    }

    const { result, xpAwarded } = finalized;

    // Badge evaluation is a side effect of a submission that already
    // committed: a failure here shouldn't turn a scored submission into an
    // error response for the client.
    let badgesEarned: BadgeAwardResult[] = [];
    if (passed) {
      try {
        badgesEarned = await this.evaluateBadges.execute(input.userId);
      } catch (error) {
        this.logger.error(
          `Badge evaluation failed for user ${input.userId}`,
          error as Error,
        );
      }
    }

    return {
      result,
      xpAwarded,
      badgesEarned,
      outcome: expired ? 'expired' : 'submitted',
    };
  }

  // A terminal session's Result is immutable: an identical resubmission
  // returns it (a transport retry), a different one is a conflict. Badges
  // were announced on the first response, so they are not repeated.
  private async replay(
    session: QuestSession,
    responses: QuestResponse[],
  ): Promise<SubmitQuestOutput> {
    const result = await this.quests.findResultById(session.resultId!);
    if (session.status === 'expired') {
      return {
        result: result!,
        xpAwarded: 0,
        badgesEarned: [],
        outcome: 'expired',
      };
    }
    if (canonical(responses) !== canonical(result!.responses)) {
      throw new QuestSessionAlreadySubmittedError(session.id);
    }
    return {
      result: result!,
      xpAwarded: session.xpAwarded,
      badgesEarned: [],
      outcome: 'submitted',
    };
  }
}
