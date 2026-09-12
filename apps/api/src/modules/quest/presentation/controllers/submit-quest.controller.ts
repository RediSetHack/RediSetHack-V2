import { Body, Controller, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { QuestNotFoundError } from "../../domain/errors.js";
import { SubmitQuestUseCase } from "../../application/submit-quest.use-case.js";
import { SubmitQuestRequestDto } from "../dto/submit-quest-request.dto.js";
import { QuestResultPresenter } from "../presenters/quest-result.presenter.js";

@Controller("v1/api/quests")
export class SubmitQuestController {
  constructor(private readonly submitQuest: SubmitQuestUseCase) {}

  @Post(":questId/submit")
  @UseGuards(ClerkAuthGuard)
  async handle(
    @Param("questId", ParseIntPipe) questId: number,
    @Body() dto: SubmitQuestRequestDto,
    @CurrentUser() user: ClerkAuthenticatedUser,
  ) {
    try {
      const output = await this.submitQuest.execute({
        userId: user.id,
        questId,
        responses: dto.responses,
      });
      return QuestResultPresenter.toSubmitResponse(output);
    } catch (error) {
      if (error instanceof QuestNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
