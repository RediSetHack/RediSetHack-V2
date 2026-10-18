import type { SupportedLanguage } from '../ports/code-execution.port.js';

export type CodingCheck = { input: string; expected: string };
export type CodingErrorCategory =
  | 'none'
  | 'wrong_answer'
  | 'compile'
  | 'runtime'
  | 'timeout';

export type CodingActivity = {
  id: number;
  stageId: number;
  authoringId: string;
  title: string;
  prompt: string;
  language: SupportedLanguage;
  starterCode: string;
  competencyIds: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  objectives: { programming: string[]; security: string[] };
  provenance: Record<string, string> | null;
  visibleExamples: CodingCheck[];
  /** Server-only: must never be serialized to a learner. */
  hiddenChecks: CodingCheck[];
  passingScore: number;
  xpReward: number;
  contentVersion: string;
};

export type CodingAttempt = {
  id: string;
  learnerId: string;
  activityId: number;
  code: string;
  score: number;
  passed: boolean;
  errorCategory: CodingErrorCategory;
  checksPassed: number;
  checksTotal: number;
  visibleResults: { input: string; expected: string; actual: string; passed: boolean }[];
  elapsedMs: number;
  xpAwarded: number;
  submittedAt: Date;
};
