import type { QuestQuestion } from './quest.entity.js';

export type QuestSessionStatus = 'active' | 'submitted' | 'expired';

// The server-owned record of one timed attempt. `questions` is the snapshot
// the learner is assessed against, so later Quest edits can't change scoring
// or review of an attempt already underway.
export class QuestSession {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly questId: number,
    public readonly questions: QuestQuestion[],
    public readonly passingScore: number,
    public readonly startedAt: Date,
    public readonly expiresAt: Date,
    public readonly status: QuestSessionStatus,
    public readonly resultId: number | null,
    public readonly xpAwarded: number,
  ) {}
}
