import {
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { IncomingMessage } from "node:http";

import { ClerkAuthPort } from "../../domain/ports/clerk-auth.port.js";
import { EnsureUserUseCase } from "../../application/ensure-user.use-case.js";
import { UserPresenter } from "../presenters/user.presenter.js";

@Controller("v1/api/user")
export class SyncUserController {
  constructor(
    private readonly clerkAuth: ClerkAuthPort,
    private readonly ensureUser: EnsureUserUseCase,
  ) {}

  @Post("sync")
  async handle(@Req() request: IncomingMessage) {
    const session = await this.clerkAuth.authenticate(request);
    if (!session) {
      throw new UnauthorizedException("Missing or invalid authentication token");
    }

    const user = await this.ensureUser.execute(session);
    return UserPresenter.toResponse(user);
  }
}
