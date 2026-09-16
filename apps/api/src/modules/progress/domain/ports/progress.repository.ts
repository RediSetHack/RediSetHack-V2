export type MarkCompletedResult = {
  /** The learner's totalXp immediately before this award, for level-up detection. */
  previousXp: number;
};

export abstract class ProgressRepository {
  /** Returns `null` when the Stage was already completed (no-op, no XP awarded). */
  abstract markCompleted(
    userId: string,
    stageId: number,
    xpEarned: number,
  ): Promise<MarkCompletedResult | null>;
}
