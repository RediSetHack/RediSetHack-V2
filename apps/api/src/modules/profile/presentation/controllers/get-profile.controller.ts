import { Controller, Get, NotFoundException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProfileResponseSchema } from "@repo/contracts";

import { GetProfileUseCase } from "../../application/get-profile.use-case.js";
import { UserNotFoundError } from "../../../auth/domain/errors.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ProfilePresenter } from "../presenters/profile.presenter.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Profile & Leaderboard')
@Controller("v1/api/users")
export class GetProfileController {
  constructor(private readonly getProfile: GetProfileUseCase) {}

  @Get("profile")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated User's profile." })
  @ApiZodResponse(ProfileResponseSchema)
  @ApiNotFoundResponse({ description: 'User not found.' })
  async handle(@CurrentUser() user: ClerkAuthenticatedUser) {
    try {
      const profile = await this.getProfile.execute(user.id);
      return ProfilePresenter.toResponse(profile);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
