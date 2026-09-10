import { Inject, Injectable, Logger } from "@nestjs/common";
import { createClerkClient, type ClerkClient } from "@clerk/backend";
import type { IncomingMessage } from "node:http";
import type { ConfigService } from "@nestjs/config";

import { ClerkAuthPort, type ClerkAuthenticatedUser } from "../domain/ports/clerk-auth.port.js";

export const CLERK_CLIENT = Symbol("CLERK_CLIENT");

export type ClerkRequestClient = Pick<ClerkClient, "authenticateRequest">;

type ClerkClientFactory = (config: ConfigService) => ClerkRequestClient;

export const clerkClientFactory: ClerkClientFactory = (config) =>
  createClerkClient({
    secretKey: config.get<string>("CLERK_SECRET_KEY"),
    publishableKey: config.get<string>("CLERK_PUBLISHABLE_KEY"),
  });

type Claims = { [key: string]: unknown } | null | undefined;

function readRole(claims: Claims): ClerkAuthenticatedUser["role"] {
  const metadata = claims?.["publicMetadata"];
  return metadata != null &&
    typeof metadata === "object" &&
    "role" in metadata &&
    metadata["role"] === "admin"
    ? "admin"
    : "user";
}

function readString(claims: Claims, key: string): string | null {
  const value = claims?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function formatDisplayName(name: string | null, lastName: string | null): string | null {
  if (lastName) {
    return name ? `${name} ${lastName}` : lastName;
  }
  return name;
}

function toClerkAuthenticatedUser(
  userId: string,
  claims: Claims,
): ClerkAuthenticatedUser {
  const name = readString(claims, "name") ?? readString(claims, "firstName");
  const lastName = readString(claims, "lastName");
  return {
    id: userId,
    email: readString(claims, "email"),
    name: formatDisplayName(name, lastName),
    role: readRole(claims),
  };
}

@Injectable()
export class ClerkAuthService implements ClerkAuthPort {
  private readonly logger = new Logger(ClerkAuthService.name);

  constructor(@Inject(CLERK_CLIENT) private readonly clerk: ClerkRequestClient) {}

  async authenticate(request: IncomingMessage): Promise<ClerkAuthenticatedUser | null> {
    const webRequest = this.toWebRequest(request);
    const requestState = await this.clerk.authenticateRequest(webRequest, {
      acceptsToken: "session_token",
    });
    if (requestState.status !== "signed-in") {
      return null;
    }
    const auth = await requestState.toAuth();
    if (!auth.userId) {
      this.logger.warn("Signed-in request state returned no userId");
      return null;
    }
    return toClerkAuthenticatedUser(auth.userId, auth.sessionClaims);
  }

  private toWebRequest(request: IncomingMessage): Request {
    const protocol = firstHeader(request, "x-forwarded-proto") ?? "http";
    const host = firstHeader(request, "x-forwarded-host") ?? request.headers.host ?? "localhost";
    const url = `${protocol}://${host}${request.url ?? "/"}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else {
        headers.append(key, value);
      }
    }
    return new Request(url, { method: request.method, headers });
  }
}

function firstHeader(request: IncomingMessage, key: string): string | undefined {
  const value = request.headers[key];
  if (Array.isArray(value)) return value[0];
  return value;
}