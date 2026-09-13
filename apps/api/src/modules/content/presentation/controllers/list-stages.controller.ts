import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";

import { ListStagesUseCase } from "../../application/list-stages.use-case.js";
import { StagePresenter } from "../presenters/stage.presenter.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";

@Controller("v1/api/zones/:zoneId/stages")
export class ListStagesController {
  constructor(private readonly listStages: ListStagesUseCase) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  async handle(
    @Param("zoneId", ParseIntPipe) zoneId: number,
    @CurrentUser() user: ClerkAuthenticatedUser,
  ) {
    const stages = await this.listStages.execute(user.id, zoneId);
    return stages.map(StagePresenter.toResponse);
  }
}
