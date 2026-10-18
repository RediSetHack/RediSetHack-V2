import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import { StageRepository } from '../../content/domain/ports/stage.repository.js';
import { GetTodayEventUseCase } from '../../daily-event/application/get-today-event.use-case.js';
import { assertStageAccess } from '../../progress/application/stage-access.js';
import { CtfChallengeNotFoundError } from '../domain/errors.js';
import { CtfRepository, type CtfChallenge } from '../domain/ports/ctf.repository.js';

const MAX_ATTEMPTS_PER_MINUTE = 5;

const sha256 = (text: string) => createHash('sha256').update(text).digest();

/** Learner-safe challenge: the flag hash and artifact are dropped here, at the only door out. */
const toView = (c: CtfChallenge, solved: boolean) => ({
  id: c.id,
  title: c.title,
  category: c.category,
  difficulty: c.difficulty,
  skills: c.competencyIds,
  xpReward: c.xpReward,
  solved,
});

@Injectable()
export class CtfUseCase {
  constructor(
    private readonly challenges: CtfRepository,
    private readonly stages: StageRepository,
    private readonly getTodayEvent: GetTodayEventUseCase,
  ) {}

  async list(learnerId: string) {
    const [all, solved] = await Promise.all([this.challenges.listActive(), this.challenges.solvedChallengeIds(learnerId)]);
    const visible: ReturnType<typeof toView>[] = [];
    for (const c of all) {
      // Eligibility: locked or archived stages hide their challenges rather than erroring the catalog.
      if (await this.eligible(learnerId, c)) visible.push(toView(c, solved.has(c.id)));
    }
    return visible;
  }

  async view(learnerId: string, challengeId: number) {
    const challenge = await this.load(learnerId, challengeId);
    return { ...toView(challenge, (await this.challenges.solvedChallengeIds(learnerId)).has(challengeId)), brief: challenge.brief };
  }

  async artifact(learnerId: string, challengeId: number) {
    const { artifactName, artifact } = await this.load(learnerId, challengeId);
    return { name: artifactName, content: artifact };
  }

  async submit(learnerId: string, challengeId: number, flag: string) {
    const challenge = await this.load(learnerId, challengeId);
    // Hash both sides so the comparison is constant-time and length-independent.
    const correct = timingSafeEqual(sha256(flag.trim()), Buffer.from(challenge.flagHash, 'hex'));
    const event = await this.getTodayEvent.execute();
    return this.challenges.recordAttempt(challenge, learnerId, correct, challenge.xpReward * event.xpMultiplier, MAX_ATTEMPTS_PER_MINUTE);
  }

  private async eligible(learnerId: string, c: CtfChallenge) {
    try {
      if (await this.challenges.hasArchivedAncestor(c.id)) return false;
      await assertStageAccess(this.stages, learnerId, c.stageId);
      return true;
    } catch {
      return false;
    }
  }

  private async load(learnerId: string, challengeId: number): Promise<CtfChallenge> {
    const challenge = await this.challenges.findById(challengeId);
    if (!challenge || (await this.challenges.hasArchivedAncestor(challengeId))) throw new CtfChallengeNotFoundError(challengeId);
    await assertStageAccess(this.stages, learnerId, challenge.stageId);
    return challenge;
  }
}
