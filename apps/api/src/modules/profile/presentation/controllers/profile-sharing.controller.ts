import { Body, Controller, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProfileSharingSchema, SharedProfileResponseSchema } from "@repo/contracts";

import { SetProfileSharingUseCase } from "../../application/set-profile-sharing.use-case.js";
import { GetSharedProfileUseCase, SharedProfileNotFoundError } from "../../application/get-shared-profile.use-case.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";
import { SetProfileSharingDto } from "../dto/set-profile-sharing.dto.js";

@ApiTags('Profile & Leaderboard')
@Controller("v1/api")
export class ProfileSharingController {
  constructor(
    private readonly setSharing: SetProfileSharingUseCase,
    private readonly getShared: GetSharedProfileUseCase,
  ) {}

  @Put("users/profile/sharing")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Turn the authenticated User's shareable accomplishment profile on or off (off revokes the link)." })
  @ApiZodResponse(ProfileSharingSchema)
  async enableOrRevoke(@CurrentUser() user: ClerkAuthenticatedUser, @Body() body: SetProfileSharingDto) {
    return this.setSharing.execute(user.id, body.enabled);
  }

  @Get("shared-profiles/:shareId")
  @HttpCode(200)
  @ApiOperation({ summary: "Public, limited accomplishment summary for a shared profile." })
  @ApiZodResponse(SharedProfileResponseSchema)
  @ApiNotFoundResponse({ description: "Unknown or revoked share link." })
  async shared(@Param("shareId", new ParseUUIDPipe({ exceptionFactory: () => new NotFoundException("Shared profile not found.") })) shareId: string) {
    try {
      return await this.getShared.execute(shareId);
    } catch (error) {
      if (error instanceof SharedProfileNotFoundError) throw new NotFoundException("Shared profile not found.");
      throw error;
    }
  }
}
