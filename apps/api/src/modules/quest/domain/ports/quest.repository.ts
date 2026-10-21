import type { QuestBestResult } from '@repo/contracts';

import { Quest, QuestQuestion } from '../entities/quest.entity.js';
import {
  QuestResult,
  type QuestResponse,
} from '../entities/quest-result.entity.js';
import { QuestSession } from '../entities/quest-session.entity.js';

export type CreateSessionInput = {
  userId: string;
  questId: number;
  questions: QuestQuestion[];
  passingScore: number;
  expiresAt: Date;
};

export type FinalizeSessionInput = {
  sessionId: number;
  status: 'submitted' | 'expired';
  score: number;
  passed: boolean;
  responses: QuestResponse[];
  xpToAward?: number;
};

export abstract class QuestRepository {
  abstract findAll(): Promise<Quest[]>;
  abstract findById(questId: number): Promise<Quest | null>;
  abstract findQuestions(questId: number): Promise<QuestQuestion[]>;
  // The learner's best Result per Quest: the highest-scoring attempt and
  // whether that attempt passed. Quests they never took are absent.
  abstract findBestResults(
    userId: string,
  ): Promise<Map<number, QuestBestResult>>;
  abstract findActiveSession(
    userId: string,
    questId: number,
  ): Promise<QuestSession | null>;
  abstract findSessionById(sessionId: number): Promise<QuestSession | null>;
  // Inserts a new active session; if the learner already has one for this
  // Quest (a concurrent start), returns that one instead.
  abstract createSession(input: CreateSessionInput): Promise<QuestSession>;
  // Atomically records the terminal Result, first-pass claim, XP balance,
  // and credited session amount. Failure rolls back all of them. Returns null
  // when the session was no longer active, i.e.
  // another request already finalized it.
  abstract finalizeSession(
    input: FinalizeSessionInput,
  ): Promise<{ result: QuestResult; xpAwarded: number } | null>;
  abstract findResultById(resultId: number): Promise<QuestResult | null>;
}
