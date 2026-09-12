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

  it("reads email and name from alternative claim formats (e.g. primary_email_address, full_name)", async () => {
    const authenticateRequest = vi.fn().mockResolvedValue(
      signedInState({
        primary_email_address: "custom@example.com",
        full_name: "Custom User",
      }),
    );
    const service = new ClerkAuthService({ authenticateRequest } as unknown as ClerkRequestClient);

    const result = await service.authenticate(makeRequest());

    expect(result).toEqual({
      id: "user_123",
      email: "custom@example.com",
      name: "Custom User",
      role: "user",
    });
  });

  it("reads email and name from firstName, lastName, and email_address claims", async () => {
    const authenticateRequest = vi.fn().mockResolvedValue(
      signedInState({
        email_address: "firstlast@example.com",
        firstName: "Grace",
        lastName: "Hopper",
      }),
    );
    const service = new ClerkAuthService({ authenticateRequest } as unknown as ClerkRequestClient);

    const result = await service.authenticate(makeRequest());

    expect(result).toEqual({
      id: "user_123",
      email: "firstlast@example.com",
      name: "Grace Hopper",
      role: "user",
    });
  });

  it("returns null for signed-out request states", async () => {
    const authenticateRequest = vi.fn().mockResolvedValue(signedOutState());
    const service = new ClerkAuthService({ authenticateRequest } as unknown as ClerkRequestClient);

    const result = await service.authenticate(makeRequest());

    expect(result).toBeNull();
  });
});