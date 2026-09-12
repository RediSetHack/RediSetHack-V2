import { Module } from "@nestjs/common";

import { DailyEventRepository } from "./domain/ports/daily-event.repository.js";
import { GetTodayEventUseCase } from "./application/get-today-event.use-case.js";
import { DrizzleDailyEventRepository } from "./infrastructure/drizzle-daily-event.repository.js";
import { GetTodayEventController } from "./presentation/controllers/get-today-event.controller.js";

@Module({
  controllers: [GetTodayEventController],
  providers: [
    { provide: DailyEventRepository, useClass: DrizzleDailyEventRepository },
    GetTodayEventUseCase,
  ],
})
export class DailyEventModule {}
