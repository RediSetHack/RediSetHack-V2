import { Module } from '@nestjs/common';

import { ContentModule } from '../content/content.module.js';
import { DailyEventModule } from '../daily-event/daily-event.module.js';
import { CtfUseCase } from './application/ctf.use-case.js';
import { CtfRepository } from './domain/ports/ctf.repository.js';
import { DrizzleCtfRepository } from './infrastructure/drizzle-ctf.repository.js';
import { CtfController } from './presentation/controllers/ctf.controller.js';

@Module({
  imports: [ContentModule, DailyEventModule],
  controllers: [CtfController],
  providers: [{ provide: CtfRepository, useClass: DrizzleCtfRepository }, CtfUseCase],
  exports: [CtfUseCase],
})
export class CtfModule {}
