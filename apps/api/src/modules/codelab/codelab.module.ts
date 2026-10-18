import { Module } from '@nestjs/common';

import { ContentModule } from '../content/content.module.js';
import { DailyEventModule } from '../daily-event/daily-event.module.js';
import { CodeExecutionPort } from './domain/ports/code-execution.port.js';
import { CodingActivityRepository } from './domain/ports/coding-activity.repository.js';
import { ExecuteCodeUseCase } from './application/execute-code.use-case.js';
import { GradeCodingActivityUseCase } from './application/grade-coding-activity.use-case.js';
import { DrizzleCodingActivityRepository } from './infrastructure/drizzle-coding-activity.repository.js';
import { PistonCodeExecutionService } from './infrastructure/piston-code-execution.service.js';
import { CodingActivityController } from './presentation/controllers/coding-activity.controller.js';
import { ExecuteCodeController } from './presentation/controllers/execute-code.controller.js';

@Module({
  imports: [ContentModule, DailyEventModule],
  controllers: [ExecuteCodeController, CodingActivityController],
  providers: [
    { provide: CodeExecutionPort, useClass: PistonCodeExecutionService },
    { provide: CodingActivityRepository, useClass: DrizzleCodingActivityRepository },
    ExecuteCodeUseCase,
    GradeCodingActivityUseCase,
  ],
})
export class CodelabModule {}
