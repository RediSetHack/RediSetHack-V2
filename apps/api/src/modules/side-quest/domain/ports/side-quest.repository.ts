import type { SideQuestPrerequisite } from '@repo/contracts';
import type { LearnerFacts } from '../prerequisites.js';

export type SideQuest = {
  id: number;
  title: string;
  summary: string;
  brief: string;
  activityType: 'ctf' | 'coding';
  activityId: number;
  prerequisites: SideQuestPrerequisite[];
  xpReward: number;
  contentVersion: string;
  /** Copied from the designated activity for the learning event. */
  competencyIds: string[];
  difficulty: string | null;
};

export type SideQuestProgress = { startedAt: Date | null; completed: boolean };

export abstract class SideQuestRepository {
  /** Active Side Quests whose designated activity is still active. */
  abstract listActive(): Promise<SideQuest[]>;
  abstract findById(id: number): Promise<SideQuest | null>;
  abstract factsFor(learnerId: string): LearnerFacts;
  abstract progress(learnerId: string): Promise<Map<number, SideQuestProgress>>;
  /** Idempotent: returns the original start time on a repeat. */
  abstract start(learnerId: string, sideQuestId: number): Promise<Date>;
  abstract hasStarted(learnerId: string, sideQuestId: number): Promise<boolean>;
  /**
   * Records the completion, credits `xp` and writes the learning event
   * atomically, exactly once per learner+Side Quest (the unique completion
   * row is the gate). A repeat reports `alreadyCompleted` and pays nothing.
   */
  abstract complete(
    sideQuest: SideQuest,
    learnerId: string,
    xp: number,
  ): Promise<{ alreadyCompleted: boolean; xpAwarded: number }>;
}
