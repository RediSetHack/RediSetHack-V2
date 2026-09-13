import { Controller, Get, NotFoundException, Param, ParseIntPipe, UseGuards } from "@nestjs/common";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { QuestResultNotFoundError } from "../../domain/errors.js";
import { ViewQuestResultUseCase } from "../../application/view-quest-result.use-case.js";
import { QuestResultPresenter } from "../presenters/quest-result.presenter.js";

@Controller("v1/api/quests/results")
export class ViewQuestResultController {
  constructor(private readonly viewQuestResult: ViewQuestResultUseCase) {}

  @Get(":resultId")
  @UseGuards(ClerkAuthGuard)
  async handle(
    @Param("resultId", ParseIntPipe) resultId: number,
    @CurrentUser() user: ClerkAuthenticatedUser,
  ) {
    try {
      const review = await this.viewQuestResult.execute(resultId, user.id);
      return QuestResultPresenter.toReviewResponse(review);
    } catch (error) {
      if (error instanceof QuestResultNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
