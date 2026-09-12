import { Module } from "@nestjs/common";

import { ContentModule } from "../content/content.module.js";
import { DailyEventModule } from "../daily-event/daily-event.module.js";
import { ProgressRepository } from "./domain/ports/progress.repository.js";
import { GetStageLessonUseCase } from "./application/get-stage-lesson.use-case.js";
import { MarkStageCompleteUseCase } from "./application/mark-stage-complete.use-case.js";
import { DrizzleProgressRepository } from "./infrastructure/drizzle-progress.repository.js";
import { GetStageLessonController } from "./presentation/controllers/get-stage-lesson.controller.js";
import { MarkStageCompleteController } from "./presentation/controllers/mark-stage-complete.controller.js";

@Module({
  imports: [ContentModule, DailyEventModule],
  controllers: [GetStageLessonController, MarkStageCompleteController],
  providers: [
    { provide: ProgressRepository, useClass: DrizzleProgressRepository },
    GetStageLessonUseCase,
    MarkStageCompleteUseCase,
  ],
})
export class ProgressModule {}