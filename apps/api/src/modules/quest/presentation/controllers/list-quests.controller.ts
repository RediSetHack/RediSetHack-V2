import { Controller, Get, UseGuards } from "@nestjs/common";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ListQuestsUseCase } from "../../application/list-quests.use-case.js";
import { QuestPresenter } from "../presenters/quest.presenter.js";

@Controller("v1/api/quests")
export class ListQuestsController {
  constructor(private readonly listQuests: ListQuestsUseCase) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  async handle(@CurrentUser() user: ClerkAuthenticatedUser) {
    const quests = await this.listQuests.execute(user.id);
    return quests.map((entry) => QuestPresenter.toListItem(entry));
  }
}
