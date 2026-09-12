import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetLeaderboardUseCase } from "../../application/get-leaderboard.use-case.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { LeaderboardQueryDto } from "../dto/leaderboard-query.dto.js";
import { LeaderboardPresenter } from "../presenters/leaderboard.presenter.js";

@Controller("api/v1/leaderboard")
export class GetLeaderboardController {
  constructor(private readonly getLeaderboard: GetLeaderboardUseCase) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  async handle(@Query() query: LeaderboardQueryDto) {
    const page = await this.getLeaderboard.execute(query.page, query.limit);
    return LeaderboardPresenter.toResponse(page);
  }
}
