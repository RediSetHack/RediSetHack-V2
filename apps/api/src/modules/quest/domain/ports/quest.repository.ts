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
};

export abstract class QuestRepository {
  abstract findAll(): Promise<Quest[]>;
  abstract findById(questId: number): Promise<Quest | null>;
  abstract findQuestions(questId: number): Promise<QuestQuestion[]>;
  abstract findPassedQuestIds(userId: string): Promise<Set<number>>;
  abstract findActiveSession(
    userId: string,
    questId: number,
  ): Promise<QuestSession | null>;
  abstract findSessionById(sessionId: number): Promise<QuestSession | null>;
  // Inserts a new active session; if the learner already has one for this
  // Quest (a concurrent start), returns that one instead.
  abstract createSession(input: CreateSessionInput): Promise<QuestSession>;
  // Atomically moves an active session to its terminal status and records
  // its Result. Returns null when the session was no longer active, i.e.
  // another request already finalized it.
  abstract finalizeSession(
    input: FinalizeSessionInput,
  ): Promise<QuestResult | null>;
  abstract recordSessionXp(sessionId: number, xpAwarded: number): Promise<void>;
  // Atomically claims the first-pass XP award for (userId, questId); returns
  // true only for the caller that wins the race, false for every other one.
  abstract claimXpAward(userId: string, questId: number): Promise<boolean>;
  abstract findResultById(resultId: number): Promise<QuestResult | null>;
}
