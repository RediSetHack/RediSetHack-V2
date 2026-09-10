import type { ClerkAuthenticatedUser } from "./domain/ports/clerk-auth.port.js";
import type { User } from "./domain/entities/user.entity.js";

export type AuthContext = {
  session: ClerkAuthenticatedUser;
  user: User;
};

declare module "node:http" {
  interface IncomingMessage {
    authContext?: AuthContext;
  }
}