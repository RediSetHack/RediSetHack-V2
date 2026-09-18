import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LeaderboardResponseSchema } from "@repo/contracts";

import { GetLeaderboardUseCase } from "../../application/get-leaderboard.use-case.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { LeaderboardQueryDto } from "../dto/leaderboard-query.dto.js";
import { LeaderboardPresenter } from "../presenters/leaderboard.presenter.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Profile & Leaderboard')
@Controller("v1/api/leaderboard")
export class GetLeaderboardController {
  constructor(private readonly getLeaderboard: GetLeaderboardUseCase) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a page of the XP Leaderboard.' })
  @ApiZodResponse(LeaderboardResponseSchema)
  async handle(@Query() query: LeaderboardQueryDto) {
    const page = await this.getLeaderboard.execute(query.page, query.limit);
    return LeaderboardPresenter.toResponse(page);
  }
}
