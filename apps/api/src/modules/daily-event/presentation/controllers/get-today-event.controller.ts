import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { DailyEventResponseSchema } from "@repo/contracts";

import { GetTodayEventUseCase } from "../../application/get-today-event.use-case.js";
import { DailyEventPresenter } from "../presenters/daily-event.presenter.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Events')
@Controller("v1/api/events")
export class GetTodayEventController {
  constructor(private readonly getTodayEvent: GetTodayEventUseCase) {}

  @Get("today")
  @ApiOperation({ summary: "Get today's Event." })
  @ApiZodResponse(DailyEventResponseSchema)
  async handle() {
    const event = await this.getTodayEvent.execute();
    return DailyEventPresenter.toResponse(event);
  }
}
