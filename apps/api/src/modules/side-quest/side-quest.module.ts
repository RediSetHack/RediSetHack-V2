import { Module } from '@nestjs/common';

import { CodelabModule } from '../codelab/codelab.module.js';
import { CtfModule } from '../ctf/ctf.module.js';
import { DailyEventModule } from '../daily-event/daily-event.module.js';
import { SideQuestUseCase } from './application/side-quest.use-case.js';
import { SideQuestRepository } from './domain/ports/side-quest.repository.js';
import { DrizzleSideQuestRepository } from './infrastructure/drizzle-side-quest.repository.js';
import { SideQuestController } from './presentation/controllers/side-quest.controller.js';

@Module({
  imports: [CtfModule, CodelabModule, DailyEventModule],
  controllers: [SideQuestController],
  providers: [{ provide: SideQuestRepository, useClass: DrizzleSideQuestRepository }, SideQuestUseCase],
})
export class SideQuestModule {}
