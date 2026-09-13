import { vi } from 'vitest';

import { EvaluateBadgesUseCase } from './application/evaluate-badges.use-case.js';
import type { BadgeRepository } from './domain/ports/badge.repository.js';

// Shared test double: every use-case spec that evaluates badges as a side
// effect (quest submission, stage completion, ...) needs the same no-op
// EvaluateBadgesUseCase, so it lives here instead of duplicated per spec.
export function makeEvaluateBadges(): EvaluateBadgesUseCase {
  const repo: BadgeRepository = {
    findAll: vi.fn().mockResolvedValue([]),
    countAwards: vi.fn(),
    awardMany: vi.fn(),
    findEarnedByUser: vi.fn(),
    countCompletedStages: vi.fn(),
    countPassedQuests: vi.fn(),
    isZoneCompleted: vi.fn(),
  };
  return new EvaluateBadgesUseCase(repo);
}
