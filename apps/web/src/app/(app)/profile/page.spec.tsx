import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCurrentUser,
  mockGetProfile,
  mockGetCharacters,
  mockGetLearningStreak,
  mockGetBadgeDefinitions,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockGetProfile: vi.fn(),
  mockGetCharacters: vi.fn(),
  mockGetLearningStreak: vi.fn(),
  mockGetBadgeDefinitions: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock("@/lib/api-client", () => ({
  getProfile: mockGetProfile,
  getCharacters: mockGetCharacters,
  getLearningStreak: mockGetLearningStreak,
  getBadgeDefinitions: mockGetBadgeDefinitions,
}));

vi.mock("@/components/profile-view", () => ({
  ProfileView: ({
    account,
    badgeDescriptions,
    profileError,
  }: Record<string, unknown>) => (
    <div data-testid="profile-view">
      <span data-testid="account">{JSON.stringify(account)}</span>
      <span data-testid="badge-descriptions">{JSON.stringify(badgeDescriptions)}</span>
      <span data-testid="profile-error">{String(profileError)}</span>
    </div>
  ),
}));

import ProfilePage from "./page";

describe("profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ getToken: vi.fn().mockResolvedValue("token") });
    mockCurrentUser.mockResolvedValue({
      fullName: "Jai Dela Cruz",
      firstName: "Jai",
      lastName: "Dela Cruz",
      primaryEmailAddress: { emailAddress: "jai@example.com" },
      emailAddresses: [{ emailAddress: "jai@example.com" }],
    });
    mockGetProfile.mockResolvedValue({
      userId: "user-1",
      character: { id: 1, name: "Kalayaan", slug: "kalayaan", imageUrl: null },
      totalXp: 1240,
      level: 4,
      adventurerRank: 4,
      accomplishments: { novelsCompleted: 3, sideQuestsCompleted: 5, ctfsSolved: 2 },
      sharing: { shareId: null },
      badges: [
        {
          badgeDefinitionId: 7,
          name: "Pull Shark",
          slug: "pull-shark",
          imageUrl: null,
          count: 3,
          latestAwardedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      activity: [],
      initialCompetencyBaseline: null,
    });
    mockGetCharacters.mockResolvedValue([]);
    mockGetLearningStreak.mockResolvedValue(null);
    mockGetBadgeDefinitions.mockResolvedValue([
      {
        id: 7,
        name: "Pull Shark",
        slug: "pull-shark",
        description: "Earned for pulling three quests in a row.",
        imageUrl: null,
        criteria: { trigger: "cumulative", target: "stage_completions", threshold: 5 },
      },
    ]);
  });

  it("hands the view the account details and the Badge descriptions", async () => {
    const markup = renderToStaticMarkup(await ProfilePage());

    expect(markup).toContain("jai@example.com");
    expect(markup).toContain("Jai Dela Cruz");
    expect(markup).toContain("Earned for pulling three quests in a row.");
  });

  it("tells the view that the profile could not be loaded", async () => {
    mockGetProfile.mockRejectedValue(new Error("boom"));

    const markup = renderToStaticMarkup(await ProfilePage());

    expect(markup).toContain('data-testid="profile-error">true<');
  });

  it("still renders the profile when the Badge catalog is unavailable", async () => {
    mockGetBadgeDefinitions.mockRejectedValue(new Error("boom"));

    const markup = renderToStaticMarkup(await ProfilePage());

    expect(markup).toContain('data-testid="badge-descriptions">{}<');
  });
});
