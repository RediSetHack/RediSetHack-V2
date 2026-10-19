export interface InteractionRecord {
  id: string;
  learnerId: string;
  activityType: "quest" | "reading" | "coding" | "ctf" | "side_quest";
  activityId: number;
  occurredAt: Date;
  elapsedMs: number | null;
  elapsedDefinition: string;
  contentVersion: string;
  skills: string[];
  difficulty: string | null;
  correctness: boolean | null;
  outcome: unknown;
  errors: unknown;
  hints: unknown;
}

export abstract class InteractionSourceRepository {
  /** Interactions of existing, non-deleted learners, oldest first (ties by id), at most `limit + 1` rows so truncation is detectable. */
  abstract listEligible(limit: number): Promise<InteractionRecord[]>;
  abstract countDeletedLearnerRows(): Promise<number>;
}
