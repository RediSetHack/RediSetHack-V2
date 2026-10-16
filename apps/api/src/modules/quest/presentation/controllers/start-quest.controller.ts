import { Controller, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { QuestSessionResponseSchema } from "@repo/contracts";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { QuestNotFoundError } from "../../domain/errors.js";
import { StartQuestUseCase } from "../../application/start-quest.use-case.js";
import { QuestPresenter } from "../presenters/quest.presenter.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Quests')
@Controller("v1/api/quests")
export class StartQuestController {
  constructor(private readonly startQuest: StartQuestUseCase) {}

  @Post(":questId/start")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a Quest Session.' })
  @ApiParam({ name: 'questId', description: "The Quest's id." })
  @ApiZodResponse(QuestSessionResponseSchema, { status: 201 })
  @ApiNotFoundResponse({ description: 'Quest not found.' })
  async handle(@Param("questId", ParseIntPipe) questId: number) {
    try {
      const session = await this.startQuest.execute(questId);
      return QuestPresenter.toSession(session);
    } catch (error) {
      if (error instanceof QuestNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
