import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

import type { ClerkAuthenticatedUser } from "../../domain/ports/clerk-auth.port.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ClerkAuthenticatedUser => {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    if (!request.authContext) {
      throw new UnauthorizedException("No authenticated user in request context");
    }
    return request.authContext.session;
  },
);