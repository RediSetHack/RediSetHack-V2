import { Controller, Get } from "@nestjs/common";

import { GetTodayEventUseCase } from "../../application/get-today-event.use-case.js";
import { DailyEventPresenter } from "../presenters/daily-event.presenter.js";

@Controller("v1/api/events")
export class GetTodayEventController {
  constructor(private readonly getTodayEvent: GetTodayEventUseCase) {}

  @Get("today")
  async handle() {
    const event = await this.getTodayEvent.execute();
    return DailyEventPresenter.toResponse(event);
  }
}
