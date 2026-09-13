export abstract class ProgressRepository {
  abstract markCompleted(userId: string, stageId: number, xpEarned: number): Promise<boolean>;
}