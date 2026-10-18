import { describe, expect, it } from 'vitest';
import { evaluatePrerequisites, type LearnerFacts } from './domain/prerequisites.js';

const facts = (over: Partial<LearnerFacts> = {}): LearnerFacts => ({
  level: async () => 3,
  hasBadge: async (s) => s === 'owned',
  completedNovel: async (s) => s === 'done',
  completedActivity: async (t, id) => t === 'ctf' && id === 7,
  ...over,
});

describe('evaluatePrerequisites', () => {
  it('evaluates every clause type independently with an actionable message', async () => {
    const result = await evaluatePrerequisites(
      [
        { type: 'level', minLevel: 3 },
        { type: 'level', minLevel: 4 },
        { type: 'badge', badgeSlug: 'owned' },
        { type: 'badge', badgeSlug: 'missing' },
        { type: 'novel', regionSlug: 'done' },
        { type: 'novel', regionSlug: 'other' },
        { type: 'activity', activityType: 'ctf', activityId: 7 },
        { type: 'activity', activityType: 'coding', activityId: 7 },
      ],
      facts(),
    );
    expect(result.map((r) => r.met)).toEqual([true, false, true, false, true, false, true, false]);
    expect(result[1]!.message).toMatch(/Adventurer Rank 4/);
  });

  it('always denies skill-gated clauses because skill estimates are unknown', async () => {
    const [skill] = await evaluatePrerequisites([{ type: 'skill', skillId: 'programming.control-flow', minScore: 0 }], facts());
    expect(skill).toMatchObject({ type: 'skill', met: false });
  });

  it('is vacuously satisfied with no clauses', async () => {
    expect(await evaluatePrerequisites([], facts())).toEqual([]);
  });
});
