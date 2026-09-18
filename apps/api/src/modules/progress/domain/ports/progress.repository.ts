export abstract class ProgressRepository {
  // Returns the user's new total XP after the award, or null when the
  // completion was already recorded (the concurrent duplicate loses the race
  // at the unique constraint and gets no XP).
  abstract markCompleted(
    userId: string,
    stageId: number,
    xpEarned: number,
  ): Promise<number | null>;
}