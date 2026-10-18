import { Injectable, Logger } from '@nestjs/common';

import {
  EvaluateBadgesUseCase,
  type BadgeAwardResult,
} from '../../badge/application/evaluate-badges.use-case.js';
import { StageRepository } from '../../content/domain/ports/stage.repository.js';
import { ProgressRepository } from '../domain/ports/progress.repository.js';
import {
  StageAlreadyCompletedError,
  StageLockedError,
  StageNotFoundError,
} from '../domain/errors.js';
import { GetTodayEventUseCase } from '../../daily-event/application/get-today-event.use-case.js';
import { calculateLevel } from '../../profile/domain/level-calculator.js';
import { getStageAccess, isUnlocked } from './stage-access.js';
import { createHash } from 'node:crypto';

export type StageCompletion = {
  stageId: number;
  xpEarned: number;
  eventMultiplier: number;
  eventType: 'normal' | 'bonus';
  level: number;
  leveledUp: boolean;
  badgesEarned: BadgeAwardResult[];
};

@Injectable()
export class MarkStageCompleteUseCase {
  private readonly logger = new Logger(MarkStageCompleteUseCase.name);

  constructor(
    private readonly stages: StageRepository,
    private readonly progress: ProgressRepository,
    private readonly getTodayEvent: GetTodayEventUseCase,
    private readonly evaluateBadges: EvaluateBadgesUseCase,
  ) {}

  async execute(userId: string, stageId: number): Promise<StageCompletion> {
    const stage = await this.stages.findById(stageId);
    if (!stage) throw new StageNotFoundError(stageId);

    const access = await getStageAccess(this.stages, userId, stage);
    if (!isUnlocked(access)) throw new StageLockedError(stageId);
    if (access.completedIds.has(stage.id))
      throw new StageAlreadyCompletedError(stageId);

    const event = await this.getTodayEvent.execute();
    const xpEarned = stage.xpReward * event.xpMultiplier;
    const session = await this.progress.startReadingSession(userId, stage.id);

    const totalXp = await this.progress.markCompleted(
      userId,
      stage.id,
      xpEarned,
      session,
      { contentVersion: createHash('sha256').update(JSON.stringify({ id: stage.id, title: stage.title, lessonContent: stage.lessonContent, skills: stage.competencyIds, difficulty: stage.difficulty })).digest('hex'), skills: stage.competencyIds, difficulty: stage.difficulty },
    );
    if (totalXp === null) throw new StageAlreadyCompletedError(stageId);

    const level = calculateLevel(totalXp);
    const previousLevel = calculateLevel(totalXp - xpEarned);

    // Badge evaluation is a side effect of a completion that already
    // committed: a failure here shouldn't turn a successful completion into
    // an error response for the client.
    let badgesEarned: BadgeAwardResult[] = [];
    try {
      badgesEarned = await this.evaluateBadges.execute(userId);
    } catch (error) {
      this.logger.error(
        `Badge evaluation failed for user ${userId}`,
        error as Error,
      );
    }

    return {
      stageId: stage.id,
      xpEarned,
      eventMultiplier: event.xpMultiplier,
      eventType: event.eventType,
      level,
      leveledUp: level > previousLevel,
      badgesEarned,
    };
  }
}
