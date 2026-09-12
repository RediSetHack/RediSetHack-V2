import {
  Controller,
  Get,
  NotFoundException,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { IncomingMessage } from "node:http";

import { ClerkAuthPort } from "../../domain/ports/clerk-auth.port.js";
import { GetUserUseCase } from "../../application/get-user.use-case.js";
import { UserNotFoundError } from "../../domain/errors.js";
import { UserPresenter } from "../presenters/user.presenter.js";

@Controller("v1/api/user")
export class GetUserMeController {
  constructor(
    private readonly clerkAuth: ClerkAuthPort,
    private readonly getUser: GetUserUseCase,
  ) {}

  @Get("me")
  async handle(@Req() request: IncomingMessage) {
    const session = await this.clerkAuth.authenticate(request);
    if (!session) {
      throw new UnauthorizedException("Missing or invalid authentication token");
    }

    try {
      const user = await this.getUser.execute(session.id);
      return UserPresenter.toResponse(user);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException("No account associated with this email, please sign up");
      }
      throw error;
    }
  }
}
