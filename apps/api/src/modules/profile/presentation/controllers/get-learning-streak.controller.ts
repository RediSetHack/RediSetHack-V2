import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LearningStreakResponseSchema } from "@repo/contracts";

import { GetLearningStreakUseCase } from "../../application/get-learning-streak.use-case.js";
import { InvalidStreakRangeError } from "../../domain/learning-streak.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { LearningStreakQueryDto } from "../dto/learning-streak-query.dto.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Profile & Leaderboard')
@Controller("v1/api/users")
export class GetLearningStreakController {
  constructor(private readonly getLearningStreak: GetLearningStreakUseCase) {}

  @Get("learning-streak")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated User's learning streaks and daily contribution history (Asia/Manila days)." })
  @ApiZodResponse(LearningStreakResponseSchema)
  @ApiBadRequestResponse({ description: "Invalid, future, inverted or oversized date range." })
  async handle(@CurrentUser() user: ClerkAuthenticatedUser, @Query() query: LearningStreakQueryDto) {
    try {
      return await this.getLearningStreak.execute(user.id, query.from, query.to);
    } catch (error) {
      if (error instanceof InvalidStreakRangeError) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
