import { Controller, Get, NotFoundException, UseGuards } from "@nestjs/common";

import { GetProfileUseCase } from "../../application/get-profile.use-case.js";
import { UserNotFoundError } from "../../../auth/domain/errors.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ProfilePresenter } from "../presenters/profile.presenter.js";

@Controller("api/v1/users")
export class GetProfileController {
  constructor(private readonly getProfile: GetProfileUseCase) {}

  @Get("profile")
  @UseGuards(ClerkAuthGuard)
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
