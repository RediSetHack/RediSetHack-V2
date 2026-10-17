import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

import { EnsureUserUseCase } from "../../application/ensure-user.use-case.js";
import { UserDeletedError } from "../../domain/errors.js";
import { ClerkAuthPort } from "../../domain/ports/clerk-auth.port.js";
import type { AuthContext } from "../../auth.types.js";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly clerkAuth: ClerkAuthPort,
    private readonly ensureUser: EnsureUserUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const session = await this.clerkAuth.authenticate(request);
    if (!session) {
      throw new UnauthorizedException("Missing or invalid authentication token");
    }
    let user;
    try {
      user = await this.ensureUser.execute(session);
    } catch (error) {
      if (error instanceof UserDeletedError) {
        throw new UnauthorizedException("This account has been deleted");
      }
      throw error;
    }
    const authContext: AuthContext = { session, user };
    request.authContext = authContext;
    return true;
  }
}
