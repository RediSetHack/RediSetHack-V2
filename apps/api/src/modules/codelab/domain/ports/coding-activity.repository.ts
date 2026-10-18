import type {
  CodingActivity,
  CodingAttempt,
} from '../entities/coding-activity.entity.js';

export type NewCodingAttempt = Omit<CodingAttempt, 'id' | 'submittedAt' | 'xpAwarded'>;

export abstract class CodingActivityRepository {
  abstract findById(id: number): Promise<CodingActivity | null>;
  /** Insert or update by stable `authoringId`. */
  abstract upsert(activity: Omit<CodingActivity, 'id'>): Promise<CodingActivity>;
  abstract hasArchivedAncestor(activityId: number): Promise<boolean>;
  /**
   * Persists the attempt and its learning interaction atomically. When the
   * attempt passed and the learner has never been paid for this activity,
   * credits `xp` exactly once (the unique award row is the gate) and returns it
   * on the attempt; otherwise `xpAwarded` is 0.
   */
  abstract recordAttempt(
    activity: CodingActivity,
    attempt: NewCodingAttempt,
    xp: number,
  ): Promise<CodingAttempt>;
  /** Scoped to the owner: another learner's attempt is indistinguishable from a missing one. */
  abstract findAttempt(attemptId: string, learnerId: string): Promise<CodingAttempt | null>;
}
