import type { SideQuestLockReason, SideQuestPrerequisite } from '@repo/contracts';

export type PriorActivityType = Extract<SideQuestPrerequisite, { type: 'activity' }>['activityType'];

/** The learner state a prerequisite clause may read; each lookup is answered from persisted records. */
export type LearnerFacts = {
  level(): Promise<number>;
  hasBadge(slug: string): Promise<boolean>;
  completedNovel(regionSlug: string): Promise<boolean>;
  completedActivity(type: PriorActivityType, id: number): Promise<boolean>;
};

export type Requirement = SideQuestLockReason & { met: boolean };

const describe = (clause: SideQuestPrerequisite): string => {
  switch (clause.type) {
    case 'level':
      return `Reach Adventurer Rank ${clause.minLevel}.`;
    case 'badge':
      return `Earn the "${clause.badgeSlug}" Badge.`;
    case 'novel':
      return `Complete the "${clause.regionSlug}" Novel.`;
    case 'activity':
      return `Complete ${clause.activityType.replace('_', ' ')} #${clause.activityId} first.`;
    case 'skill':
      return `Demonstrate "${clause.skillId}" mastery (${clause.minScore}+). Skill estimates are not available yet, so this stays locked.`;
  }
};

const isMet = async (clause: SideQuestPrerequisite, facts: LearnerFacts): Promise<boolean> => {
  switch (clause.type) {
    case 'level':
      return (await facts.level()) >= clause.minLevel;
    case 'badge':
      return facts.hasBadge(clause.badgeSlug);
    case 'novel':
      return facts.completedNovel(clause.regionSlug);
    case 'activity':
      return facts.completedActivity(clause.activityType, clause.activityId);
    case 'skill':
      // An unknown skill estimate denies; replaced when mastery estimates are integrated.
      return false;
  }
};

export async function evaluatePrerequisites(clauses: SideQuestPrerequisite[], facts: LearnerFacts): Promise<Requirement[]> {
  return Promise.all(clauses.map(async (c) => ({ type: c.type, message: describe(c), met: await isMet(c, facts) })));
}
