import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSharedProfile, mockGetBadgeDefinitions, MockApiError } = vi.hoisted(() => {
  class ApiError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return {
    mockGetSharedProfile: vi.fn(),
    mockGetBadgeDefinitions: vi.fn(),
    MockApiError: ApiError,
  };
});

vi.mock("@/lib/api-client", () => ({
  ApiError: MockApiError,
  getSharedProfile: mockGetSharedProfile,
  getBadgeDefinitions: mockGetBadgeDefinitions,
}));

import SharedProfilePage from "./page";

const sharedProfile = {
  adventurerRank: 3,
  totalXp: 450,
  character: { name: "Kalayaan", slug: "kalayaan", imageUrl: null },
  badges: [{ name: "Pull Shark", slug: "pull-shark", imageUrl: null, count: 3 }],
  accomplishments: { novelsCompleted: 1, sideQuestsCompleted: 2, ctfsSolved: 0 },
  currentStreak: 2,
  longestStreak: 5,
};

async function renderPage() {
  return renderToStaticMarkup(
    await SharedProfilePage({ params: Promise.resolve({ shareId: "share-123" }) }),
  );
}

describe("shared profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSharedProfile.mockResolvedValue(sharedProfile);
    mockGetBadgeDefinitions.mockResolvedValue([
      {
        id: 1,
        name: "Pull Shark",
        slug: "pull-shark",
        description: "Earned for pulling three quests",
        imageUrl: null,
        criteria: { trigger: "cumulative", target: "stage_completions", threshold: 5 },
      },
    ]);
  });

  it("renders the public summary without the signed-in App Shell", async () => {
    const markup = await renderPage();

    expect(markup).toContain("SHARED_PROFILE.EXE");
    expect(markup).toContain("Kalayaan");
    expect(markup).toContain("Earned ×3");
    // The signed-in shell (Taskbar, Player chip, Event banner) is absent.
    expect(markup).not.toContain('aria-label="Taskbar"');
    expect(markup).not.toContain("NORMAL DAY");
    expect(markup).not.toContain("BONUS DAY");
  });

  it("keeps the public wordmark header", async () => {
    const markup = await renderPage();

    expect(markup).toContain("REDISETHACK");
    expect(markup).toContain('href="/sign-in"');
  });

  it("explains a revoked link without the signed-in shell", async () => {
    mockGetSharedProfile.mockRejectedValue(new MockApiError(404, "Not found"));

    const markup = await renderPage();

    expect(markup).toContain("revoked");
    expect(markup).not.toContain('aria-label="Taskbar"');
  });

  it("announces a failed lookup", async () => {
    mockGetSharedProfile.mockRejectedValue(new MockApiError(500, "Boom"));

    const markup = await renderPage();

    expect(markup).toContain('role="alert"');
  });
});
