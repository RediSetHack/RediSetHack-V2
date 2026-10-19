import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

/** Approved contributors (Clerk `publicMetadata.role`) and admins may author; everyone else is denied. */
@Injectable()
export class ContributorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const role = context.switchToHttp().getRequest<IncomingMessage>().authContext?.session.role;
    if (role !== "contributor" && role !== "admin") {
      throw new ForbiddenException("Approved contributor privileges required");
    }
    return true;
  }
}
