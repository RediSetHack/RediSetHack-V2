import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { QuestListResponseSchema } from "@repo/contracts";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ListQuestsUseCase } from "../../application/list-quests.use-case.js";
import { QuestPresenter } from "../presenters/quest.presenter.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Quests')
@Controller("v1/api/quests")
export class ListQuestsController {
  constructor(private readonly listQuests: ListQuestsUseCase) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List Quests, with each marked completed or not for the User.',
  })
  @ApiZodResponse(QuestListResponseSchema)
  async handle(@CurrentUser() user: ClerkAuthenticatedUser) {
    const quests = await this.listQuests.execute(user.id);
    return quests.map((entry) => QuestPresenter.toListItem(entry));
  }
}
