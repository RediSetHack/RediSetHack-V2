import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { IncomingMessage } from "node:http";

import { ClerkAuthPort, type ClerkAuthenticatedUser } from "../../domain/ports/clerk-auth.port.js";
import { EnsureUserUseCase } from "../../application/ensure-user.use-case.js";
import { InvalidUserEmailError } from "../../domain/errors.js";
import { UserPresenter } from "../presenters/user.presenter.js";

export class SyncUserRequestDto {
  @ApiPropertyOptional({
    example: "ada@example.com",
    description: "Overrides the email Clerk reports, if provided.",
  })
  email?: string;

  @ApiPropertyOptional({
    example: "Ada",
    description: "Overrides the display name Clerk reports, if provided.",
  })
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
    description: 'Missing or invalid authentication token.',
  })
  @ApiBadRequestResponse({ description: 'The resolved email is invalid.' })
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
      email: body?.email && body.email.length > 0 ? body.email : session.email,
      name: body?.name && body.name.length > 0 ? body.name : session.name,
    };

    try {
      const user = await this.ensureUser.execute(identity);
      return UserPresenter.toResponse(user);
    } catch (error) {
      if (error instanceof InvalidUserEmailError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
