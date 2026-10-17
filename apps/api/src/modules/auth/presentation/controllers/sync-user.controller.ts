import {
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";
import type { IncomingMessage } from "node:http";

import { ClerkAuthPort, type ClerkAuthenticatedUser } from "../../domain/ports/clerk-auth.port.js";
import { EnsureUserUseCase } from "../../application/ensure-user.use-case.js";
import { InvalidUserEmailError, UserDeletedError } from "../../domain/errors.js";
import { UserPresenter } from "../presenters/user.presenter.js";

export class SyncUserRequestDto {
  @ApiPropertyOptional({
    example: "Ada",
    description: "Optional display name supplied during signup.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

@ApiTags('Authentication & Account')
@Controller("v1/api/user")
export class SyncUserController {
  constructor(
    private readonly clerkAuth: ClerkAuthPort,
    private readonly ensureUser: EnsureUserUseCase,
  ) {}

  @Post("sync")
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update the authenticated User from the Clerk session.',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token, or account was deleted.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Verified email is temporarily unavailable; retry onboarding.',
  })
  async handle(
    @Req() request: IncomingMessage,
    @Body() body?: SyncUserRequestDto,
  ) {
    const session = await this.clerkAuth.authenticate(request);
    if (!session) {
      throw new UnauthorizedException("Missing or invalid authentication token");
    }

    const identity: ClerkAuthenticatedUser = {
      ...session,
      name: body?.name && body.name.length > 0 ? body.name : session.name,
    };

    try {
      const user = await this.ensureUser.execute(identity);
      return UserPresenter.toResponse(user);
    } catch (error) {
      if (error instanceof UserDeletedError) {
        throw new UnauthorizedException("This account has been deleted");
      }
      if (error instanceof InvalidUserEmailError) {
        throw new ServiceUnavailableException(
          "Verified email is not available yet. Retry onboarding shortly.",
        );
      }
      throw error;
    }
  }
}
