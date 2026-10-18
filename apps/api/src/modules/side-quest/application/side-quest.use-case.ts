import { Injectable } from '@nestjs/common';
import type { SideQuestLockReason } from '@repo/contracts';

import { CtfUseCase } from '../../ctf/application/ctf.use-case.js';
import { GradeCodingActivityUseCase } from '../../codelab/application/grade-coding-activity.use-case.js';
import { GetTodayEventUseCase } from '../../daily-event/application/get-today-event.use-case.js';
import { SideQuestLockedError, SideQuestNotFoundError, SideQuestNotStartedError } from '../domain/errors.js';
import { evaluatePrerequisites, type Requirement } from '../domain/prerequisites.js';
import { SideQuestRepository, type SideQuest, type SideQuestProgress } from '../domain/ports/side-quest.repository.js';

export type SideQuestAnswer = { flag?: string; code?: string };

const lockReasons = (requirements: Requirement[]): SideQuestLockReason[] =>
  requirements.filter((r) => !r.met).map(({ type, message }) => ({ type, message }));

@Injectable()
export class SideQuestUseCase {
  constructor(
    private readonly sideQuests: SideQuestRepository,
    private readonly ctf: CtfUseCase,
    private readonly coding: GradeCodingActivityUseCase,
    private readonly getTodayEvent: GetTodayEventUseCase,
  ) {}

  async list(learnerId: string) {
    const [all, progress] = await Promise.all([this.sideQuests.listActive(), this.sideQuests.progress(learnerId)]);
    return Promise.all(all.map(async (q) => this.summary(q, lockReasons(await this.requirements(learnerId, q)), progress.get(q.id))));
  }

  async view(learnerId: string, id: number) {
    const quest = await this.load(id);
    const [requirements, progress] = await Promise.all([this.requirements(learnerId, quest), this.sideQuests.progress(learnerId)]);
    const reasons = lockReasons(requirements);
    const locked = reasons.length > 0;
    return {
      ...this.summary(quest, reasons, progress.get(id)),
      requirements,
      // The objective's body and its designated activity are not revealed until the learner is eligible.
      brief: locked ? null : quest.brief,
      activity: locked ? null : { type: quest.activityType, id: quest.activityId },
    };
  }

  async start(learnerId: string, id: number) {
    const quest = await this.assertEligible(learnerId, id);
    const startedAt = await this.sideQuests.start(learnerId, quest.id);
    const completed = (await this.sideQuests.progress(learnerId)).get(id)?.completed ?? false;
    return { status: completed ? ('completed' as const) : ('in_progress' as const), startedAt: startedAt.toISOString() };
  }

  async submit(learnerId: string, id: number, answer: SideQuestAnswer) {
    const quest = await this.assertEligible(learnerId, id);
    if (!(await this.sideQuests.hasStarted(learnerId, id))) throw new SideQuestNotStartedError();
    // A replay never re-runs the designated activity (no sandbox cost, no extra attempts).
    if ((await this.sideQuests.progress(learnerId)).get(id)?.completed)
      return { passed: true, completed: true, alreadyCompleted: true, xpAwarded: 0 };

    const passed = await this.runActivity(learnerId, quest, answer);
    if (!passed) return { passed: false, completed: false, alreadyCompleted: false, xpAwarded: 0 };
    const event = await this.getTodayEvent.execute();
    const outcome = await this.sideQuests.complete(quest, learnerId, quest.xpReward * event.xpMultiplier);
    return { passed: true, completed: true, ...outcome };
  }

  private async runActivity(learnerId: string, quest: SideQuest, answer: SideQuestAnswer): Promise<boolean> {
    if (quest.activityType === 'ctf') {
      return (await this.ctf.submit(learnerId, quest.activityId, answer.flag ?? '')).correct;
    }
    return (await this.coding.submit(learnerId, quest.activityId, answer.code ?? '')).passed;
  }

  private summary(q: SideQuest, reasons: SideQuestLockReason[], progress?: SideQuestProgress) {
    const status = progress?.completed ? 'completed' : reasons.length ? 'locked' : progress?.startedAt ? 'in_progress' : 'available';
    return { id: q.id, title: q.title, summary: q.summary, xpReward: q.xpReward, status: status as 'locked' | 'available' | 'in_progress' | 'completed', lockReasons: reasons };
  }

  private requirements(learnerId: string, q: SideQuest) {
    return evaluatePrerequisites(q.prerequisites, this.sideQuests.factsFor(learnerId));
  }

  private async load(id: number): Promise<SideQuest> {
    const quest = await this.sideQuests.findById(id);
    if (!quest) throw new SideQuestNotFoundError(id);
    return quest;
  }

  private async assertEligible(learnerId: string, id: number): Promise<SideQuest> {
    const quest = await this.load(id);
    const reasons = lockReasons(await this.requirements(learnerId, quest));
    if (reasons.length) throw new SideQuestLockedError(reasons);
    return quest;
  }
}
