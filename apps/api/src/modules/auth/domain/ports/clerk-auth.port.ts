import type { IncomingMessage } from "node:http";

import type { UserRole } from "../entities/user.entity.js";

export type ClerkAuthenticatedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
};

export abstract class ClerkAuthPort {
  abstract authenticate(request: IncomingMessage): Promise<ClerkAuthenticatedUser | null>;
}