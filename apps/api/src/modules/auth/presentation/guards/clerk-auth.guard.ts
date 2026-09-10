import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

import { EnsureUserUseCase } from "../../application/ensure-user.use-case.js";
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
    const user = await this.ensureUser.execute(session);
    const authContext: AuthContext = { session, user };
    request.authContext = authContext;
    return true;
  }
}