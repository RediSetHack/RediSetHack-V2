export type CtfChallenge = {
  id: number;
  stageId: number;
  authoringId: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  competencyIds: string[];
  brief: string;
  artifactName: string;
  artifact: string;
  /** Server-only: sha256 of the flag. Must never be serialized to a learner. */
  flagHash: string;
  xpReward: number;
  contentVersion: string;
};

export type CtfAttemptOutcome = { correct: boolean; alreadySolved: boolean; xpAwarded: number };

export abstract class CtfRepository {
  abstract findById(id: number): Promise<CtfChallenge | null>;
  abstract hasArchivedAncestor(challengeId: number): Promise<boolean>;
  abstract listActive(): Promise<CtfChallenge[]>;
  abstract solvedChallengeIds(learnerId: string): Promise<Set<number>>;
  /**
   * Serialized per learner+challenge. Throws `CtfRateLimitError` (recording
   * nothing) beyond `maxPerMinute` attempts. Otherwise persists the attempt and,
   * for the first correct one, the solve, `xp` credit and learning interaction
   * atomically; wrong attempts on an unsolved challenge also log an interaction.
   */
  abstract recordAttempt(
    challenge: CtfChallenge,
    learnerId: string,
    correct: boolean,
    xp: number,
    maxPerMinute: number,
  ): Promise<CtfAttemptOutcome>;
}
