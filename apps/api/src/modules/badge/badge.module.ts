import { Module } from '@nestjs/common';

import { BadgeRepository } from './domain/ports/badge.repository.js';
import { DrizzleBadgeRepository } from './infrastructure/drizzle-badge.repository.js';
import { EvaluateBadgesUseCase } from './application/evaluate-badges.use-case.js';
import { ListBadgesUseCase } from './application/list-badges.use-case.js';
import { ListEarnedBadgesUseCase } from './application/list-earned-badges.use-case.js';
import { ListBadgesController } from './presentation/controllers/list-badges.controller.js';
import { ListEarnedBadgesController } from './presentation/controllers/list-earned-badges.controller.js';

@Module({
  controllers: [ListBadgesController, ListEarnedBadgesController],
  providers: [
    { provide: BadgeRepository, useClass: DrizzleBadgeRepository },
    EvaluateBadgesUseCase,
    ListBadgesUseCase,
    ListEarnedBadgesUseCase,
  ],
  // EvaluateBadgesUseCase is called by ProgressModule and QuestModule after
  // stage completion / quest pass events.
  exports: [EvaluateBadgesUseCase],
})
export class BadgeModule {}
