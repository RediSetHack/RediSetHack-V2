import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const session = request.authContext?.session;
    if (!session || session.role !== "admin") {
      throw new ForbiddenException("Admin privileges required");
    }
    return true;
  }
}