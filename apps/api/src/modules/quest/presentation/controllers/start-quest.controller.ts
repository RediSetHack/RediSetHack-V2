import { Controller, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { QuestNotFoundError } from "../../domain/errors.js";
import { StartQuestUseCase } from "../../application/start-quest.use-case.js";
import { QuestPresenter } from "../presenters/quest.presenter.js";

@Controller("v1/api/quests")
export class StartQuestController {
  constructor(private readonly startQuest: StartQuestUseCase) {}

  @Post(":questId/start")
  @UseGuards(ClerkAuthGuard)
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
