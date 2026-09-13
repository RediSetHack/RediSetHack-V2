import { Module } from '@nestjs/common';

import { BadgeModule } from '../badge/badge.module.js';
import { DailyEventModule } from '../daily-event/daily-event.module.js';
import { QuestRepository } from './domain/ports/quest.repository.js';
import { DrizzleQuestRepository } from './infrastructure/drizzle-quest.repository.js';
import { ListQuestsUseCase } from './application/list-quests.use-case.js';
import { StartQuestUseCase } from './application/start-quest.use-case.js';
import { SubmitQuestUseCase } from './application/submit-quest.use-case.js';
import { ViewQuestResultUseCase } from './application/view-quest-result.use-case.js';
import { ListQuestsController } from './presentation/controllers/list-quests.controller.js';
import { StartQuestController } from './presentation/controllers/start-quest.controller.js';
import { SubmitQuestController } from './presentation/controllers/submit-quest.controller.js';
import { ViewQuestResultController } from './presentation/controllers/view-quest-result.controller.js';

@Module({
  imports: [BadgeModule, DailyEventModule],
  controllers: [
    ListQuestsController,
    StartQuestController,
    SubmitQuestController,
    ViewQuestResultController,
  ],
  providers: [
    { provide: QuestRepository, useClass: DrizzleQuestRepository },
    ListQuestsUseCase,
    StartQuestUseCase,
    SubmitQuestUseCase,
    ViewQuestResultUseCase,
  ],
})
export class QuestModule {}
