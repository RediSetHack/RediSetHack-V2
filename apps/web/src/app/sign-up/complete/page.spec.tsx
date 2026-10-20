import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockSyncUser, mockRedirect, mockGetProfile, mockGetCharacters } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSyncUser: vi.fn(),
  mockRedirect: vi.fn(),
  mockGetProfile: vi.fn(),
  mockGetCharacters: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/api-client", () => ({
  syncUser: mockSyncUser,
  getProfile: mockGetProfile,
  getCharacters: mockGetCharacters,
  getCurrentUser: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: mockRedirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));
vi.mock("@/components/character-selector", () => ({
  CharacterPicker: (props: Record<string, unknown>) => (
    <div data-testid="character-picker">{JSON.stringify(props)}</div>
  ),
}));

import SignUpCompletePage from "./page";

describe("sign-up completion", () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001");
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user_123", getToken: vi.fn().mockResolvedValue("token") });
    mockSyncUser.mockResolvedValue({});
    mockGetProfile.mockResolvedValue({ character: null });
    mockGetCharacters.mockResolvedValue([]);
  });

  it("syncs the user and renders picker when no character", async () => {
    const markup = renderToStaticMarkup(await SignUpCompletePage());
    expect(mockSyncUser).toHaveBeenCalledWith("http://localhost:3001", "token");
    expect(markup).toContain("PICK_YOUR_CHARACTER.EXE");
    expect(markup).toContain("STEP 2 OF 2");
  });

  it("redirects home when profile has character", async () => {
    mockGetProfile.mockResolvedValue({ character: { id: 1 } });
    await expect(SignUpCompletePage()).rejects.toThrow("NEXT_REDIRECT:/");
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
