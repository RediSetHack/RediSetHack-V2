import { Injectable } from '@nestjs/common';

import { StageRepository } from '../../content/domain/ports/stage.repository.js';
import { assertStageAccess } from '../../progress/application/stage-access.js';
import { GetTodayEventUseCase } from '../../daily-event/application/get-today-event.use-case.js';
import type {
  CodingActivity,
  CodingAttempt,
  CodingErrorCategory,
} from '../domain/entities/coding-activity.entity.js';
import {
  CodeExecutionLimitError,
  CodeExecutionTimeoutError,
  CodingActivityNotFoundError,
  CodingAttemptNotFoundError,
} from '../domain/errors.js';
import { CodeExecutionPort } from '../domain/ports/code-execution.port.js';
import { CodingActivityRepository } from '../domain/ports/coding-activity.repository.js';

const normalize = (output: string) => output.trim().replace(/\r\n/g, '\n');

@Injectable()
export class GradeCodingActivityUseCase {
  // ponytail: per-process in-flight guard; a shared Redis limit once the API runs multi-replica.
  private readonly grading = new Set<string>();

  constructor(
    private readonly activities: CodingActivityRepository,
    private readonly execution: CodeExecutionPort,
    private readonly stages: StageRepository,
    private readonly getTodayEvent: GetTodayEventUseCase,
  ) {}

  /** Learner-safe activity: hidden checks are dropped here, at the only door out. */
  async view(learnerId: string, activityId: number) {
    const activity = await this.load(learnerId, activityId);
    const { hiddenChecks: _hidden, authoringId: _a, competencyIds: _c, contentVersion: _v, ...visible } = activity;
    return visible;
  }

  async review(learnerId: string, attemptId: string): Promise<CodingAttempt> {
    const attempt = await this.activities.findAttempt(attemptId, learnerId);
    if (!attempt) throw new CodingAttemptNotFoundError(attemptId);
    return attempt;
  }

  async submit(learnerId: string, activityId: number, code: string): Promise<CodingAttempt> {
    const activity = await this.load(learnerId, activityId);
    if (this.grading.has(learnerId)) throw new CodeExecutionLimitError();
    this.grading.add(learnerId);
    try {
      const graded = await this.grade(activity, code);
      const event = await this.getTodayEvent.execute();
      return await this.activities.recordAttempt(
        activity,
        { learnerId, activityId, code, ...graded },
        activity.xpReward * event.xpMultiplier,
      );
    } finally {
      this.grading.delete(learnerId);
    }
  }

  private async load(learnerId: string, activityId: number): Promise<CodingActivity> {
    const activity = await this.activities.findById(activityId);
    if (!activity || (await this.activities.hasArchivedAncestor(activityId)))
      throw new CodingActivityNotFoundError(activityId);
    await assertStageAccess(this.stages, learnerId, activity.stageId);
    return activity;
  }

  // Provider unavailability propagates (no attempt recorded); sandbox timeouts are learner outcomes.
  private async grade(activity: CodingActivity, code: string) {
    const checks = [...activity.visibleExamples, ...activity.hiddenChecks];
    const visibleResults: CodingAttempt['visibleResults'] = [];
    let passedCount = 0;
    let elapsedMs = 0;
    let errorCategory: CodingErrorCategory = 'none';
    for (const [index, check] of checks.entries()) {
      let actual = '';
      let ok = false;
      try {
        const result = await this.execution.execute({ language: activity.language, code, stdin: check.input });
        elapsedMs += result.executionTimeMs;
        actual = result.stdout;
        ok = result.failureType === 'none' && normalize(actual) === normalize(check.expected);
        if (!ok && errorCategory === 'none')
          errorCategory = result.failureType === 'none' ? 'wrong_answer' : result.failureType;
        if (result.failureType === 'timeout') {
          if (index < activity.visibleExamples.length) visibleResults.push({ ...check, actual: '', passed: false });
          break;
        }
        // A compile failure fails every check identically; don't spend the rest of the sandbox budget.
        if (result.failureType === 'compile') {
          if (index < activity.visibleExamples.length) visibleResults.push({ ...check, actual: '', passed: false });
          break;
        }
      } catch (error) {
        if (!(error instanceof CodeExecutionTimeoutError)) throw error;
        errorCategory = 'timeout';
        if (index < activity.visibleExamples.length) visibleResults.push({ ...check, actual: '', passed: false });
        break;
      }
      if (ok) passedCount += 1;
      if (index < activity.visibleExamples.length) visibleResults.push({ ...check, actual, passed: ok });
    }
    const score = Math.round((passedCount / checks.length) * 100);
    const passed = score >= activity.passingScore;
    return {
      score,
      passed,
      errorCategory: passed && errorCategory === 'wrong_answer' ? 'none' as const : errorCategory,
      checksPassed: passedCount,
      checksTotal: checks.length,
      visibleResults,
      elapsedMs,
    };
  }
}
