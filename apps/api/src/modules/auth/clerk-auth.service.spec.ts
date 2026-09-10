import type { IncomingMessage } from "node:http";

import { describe, expect, it, vi } from "vitest";

import { ClerkAuthService, type ClerkRequestClient } from "./infrastructure/clerk-auth.service.js";

function signedInState(sessionClaims: Record<string, unknown>) {
  return {
    status: "signed-in",
    toAuth: vi.fn().mockResolvedValue({ userId: "user_123", sessionClaims }),
  };
}

function signedOutState() {
  return {
    status: "signed-out",
    toAuth: vi.fn().mockResolvedValue({ userId: null, sessionClaims: null }),
  };
}

function makeRequest(headers: Record<string, string> = {}): IncomingMessage {
  return {
    method: "GET",
    url: "/v1/api/test",
    headers,
  } as unknown as IncomingMessage;
}

describe("ClerkAuthService", () => {
  it("maps a signed-in Clerk session to an authenticated user with admin role", async () => {
    const authenticateRequest = vi.fn().mockResolvedValue(
      signedInState({
        email: "admin@example.com",
        name: "Ada",
        publicMetadata: { role: "admin" },
      }),
    );
    const service = new ClerkAuthService({ authenticateRequest } as unknown as ClerkRequestClient);

    const result = await service.authenticate(
      makeRequest({ authorization: "Bearer token", host: "api.local" }),
    );

    expect(result).toEqual({
      id: "user_123",
      email: "admin@example.com",
      name: "Ada",
      role: "admin",
    });
    expect(authenticateRequest).toHaveBeenCalledTimes(1);
    const [webRequest] = authenticateRequest.mock.calls[0] as [Request, unknown];
    expect(webRequest).toBeInstanceOf(Request);
    expect(webRequest.url).toContain("api.local/v1/api/test");
    expect(webRequest.headers.get("authorization")).toBe("Bearer token");
  });

  it("defaults the role to user when publicMetadata.role is absent", async () => {
    const authenticateRequest = vi.fn().mockResolvedValue(
      signedInState({ email: "learner@example.com", name: "Bob", publicMetadata: {} }),
    );
    const service = new ClerkAuthService({ authenticateRequest } as unknown as ClerkRequestClient);

    const result = await service.authenticate(makeRequest());

    expect(result?.role).toBe("user");
  });

  it("returns null for signed-out request states", async () => {
    const authenticateRequest = vi.fn().mockResolvedValue(signedOutState());
    const service = new ClerkAuthService({ authenticateRequest } as unknown as ClerkRequestClient);

    const result = await service.authenticate(makeRequest());

    expect(result).toBeNull();
  });
});