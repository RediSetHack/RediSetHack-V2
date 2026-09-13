import { Quest, QuestQuestion } from '../entities/quest.entity.js';
import {
  QuestResult,
  type QuestResponse,
} from '../entities/quest-result.entity.js';

export type CreateResultInput = {
  userId: string;
  questId: number;
  score: number;
  passed: boolean;
  responses: QuestResponse[];
};

export abstract class QuestRepository {
  abstract findAll(): Promise<Quest[]>;
  abstract findById(questId: number): Promise<Quest | null>;
  abstract findQuestions(questId: number): Promise<QuestQuestion[]>;
  abstract findPassedQuestIds(userId: string): Promise<Set<number>>;
  abstract createResult(input: CreateResultInput): Promise<QuestResult>;
  // Atomically claims the first-pass XP award for (userId, questId); returns
  // true only for the caller that wins the race, false for every other one.
  abstract claimXpAward(userId: string, questId: number): Promise<boolean>;
  abstract findResultById(resultId: number): Promise<QuestResult | null>;
}
