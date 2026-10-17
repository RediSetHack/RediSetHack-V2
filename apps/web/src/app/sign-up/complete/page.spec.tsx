import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockSyncUser, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSyncUser: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/api-client", () => ({ syncUser: mockSyncUser }));
vi.mock("next/navigation", () => ({
  redirect: mockRedirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import SignUpCompletePage from "./page";

describe("sign-up completion", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001");
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user_123", getToken: vi.fn().mockResolvedValue("token") });
    mockSyncUser.mockResolvedValue({});
  });

  it("syncs the user and redirects home", async () => {
    await expect(SignUpCompletePage()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mockSyncUser).toHaveBeenCalledWith("http://localhost:3001", "token");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("shows retry UI when sync returns 503", async () => {
    mockSyncUser.mockRejectedValue(new Error("503"));
    const markup = renderToStaticMarkup(await SignUpCompletePage());
    expect(markup).toContain("role=\"alert\"");
    expect(markup).toContain("Retry onboarding");
  });

  it("shows retry UI when Clerk returns no token", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123", getToken: vi.fn().mockResolvedValue(null) });
    const markup = renderToStaticMarkup(await SignUpCompletePage());
    expect(markup).toContain("role=\"alert\"");
    expect(markup).toContain("Retry onboarding");
    expect(mockSyncUser).not.toHaveBeenCalled();
  });
});
