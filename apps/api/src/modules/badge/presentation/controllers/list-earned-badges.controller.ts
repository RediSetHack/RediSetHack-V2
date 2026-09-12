import { Controller, Get, UseGuards } from "@nestjs/common";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ListEarnedBadgesUseCase } from "../../application/list-earned-badges.use-case.js";
import { BadgePresenter } from "../presenters/badge.presenter.js";

@Controller("v1/api/badges")
export class ListEarnedBadgesController {
  constructor(private readonly listEarnedBadges: ListEarnedBadgesUseCase) {}

  @Get("me")
  @UseGuards(ClerkAuthGuard)
  async handle(@CurrentUser() user: ClerkAuthenticatedUser) {
    const earned = await this.listEarnedBadges.execute(user.id);
    return earned.map((entry) => BadgePresenter.toEarnedResponse(entry));
  }
}
