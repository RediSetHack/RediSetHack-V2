export abstract class ProgressRepository {
  abstract startReadingSession(userId: string, stageId: number): Promise<{ id: string; startedAt: Date }>;
  abstract findActiveReadingSession(userId: string, stageId: number): Promise<{ id: string; startedAt: Date } | null>;
  // Returns the user's new total XP after the award, or null when the
  // completion was already recorded (the concurrent duplicate loses the race
  // at the unique constraint and gets no XP).
  abstract markCompleted(
    userId: string,
    stageId: number,
    xpEarned: number,
    session: { id: string; startedAt: Date } | null,
    metadata: { contentVersion: string; skills: string[]; difficulty: string | null },
  ): Promise<number | null>;
}
