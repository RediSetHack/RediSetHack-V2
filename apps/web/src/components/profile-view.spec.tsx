import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProfileView } from "./profile-view";
import type { LearningStreak, Profile } from "@/lib/api-client";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("tok") }),
  useClerk: () => ({ signOut: vi.fn(), openUserProfile: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const profile: Profile = {
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
};

const streak: LearningStreak = {
  timeZone: "Asia/Manila",
  today: "2026-10-19",
  from: "2026-10-17",
  to: "2026-10-19",
  currentStreak: 2,
  longestStreak: 5,
  days: [
    { date: "2026-10-17", reading: 1, assessed: 1 },
    { date: "2026-10-18", reading: 0, assessed: 1 },
    { date: "2026-10-19", reading: 0, assessed: 0 },
  ],
};

const characters = [
  { id: 1, name: "Kalayaan", slug: "kalayaan", description: "The coder", imageUrl: null },
  { id: 2, name: "Ada", slug: "ada", description: "The first programmer", imageUrl: null },
];

function renderView(overrides: Partial<Parameters<typeof ProfileView>[0]> = {}) {
  return renderToStaticMarkup(
    <ProfileView
      profile={profile}
      profileError={false}
      streak={streak}
      characters={characters}
      charactersError={false}
      badgeDescriptions={{ "pull-shark": "Earned for pulling three quests" }}
      account={{ name: "Jai", email: "jai@example.com" }}
      apiUrl="http://localhost:3001"
      {...overrides}
    />,
  );
}

describe("ProfileView (PAGES.md §14)", () => {
  it("renders the Profile windows", () => {
    const view = renderView();
    expect(view).toContain("CHARACTER.EXE");
    expect(view).toContain("STATS.EXE");
    expect(view).toContain("LEARNING_STREAK.EXE");
    expect(view).toContain("BADGES.EXE");
    expect(view).toContain("CHANGE_CHARACTER.EXE");
    expect(view).toContain("ACCOUNT.EXE");
    expect(view).toContain("SHARED_PROFILE.EXE");
  });

  it("summarises the Character with Adventurer Rank, XP and the XP-to-next bar", () => {
    const view = renderView();
    expect(view).toContain("Kalayaan");
    expect(view).toContain("Adventurer Rank 4");
    expect(view).toContain("1,240 XP");
    expect(view).toContain('aria-label="XP to Adventurer Rank 5"');
  });

  it("shows the stat tiles", () => {
    const view = renderView();
    expect(view).toContain("Stages completed");
    expect(view).toContain("Quests passed");
    expect(view).toContain("Badges");
    expect(view).toContain("Rank");
  });

  it("shows Badge tiles with multiplicity and the catalog description", () => {
    const view = renderView();
    expect(view).toContain("Pull Shark");
    expect(view).toContain("Earned ×3");
    expect(view).toContain("Earned for pulling three quests");
  });

  it("keeps the Learning Streak counts in text", () => {
    const view = renderView();
    expect(view).toContain("Current streak: <strong>2 days</strong>");
    expect(view).toContain("Longest streak: <strong>5 days</strong>");
  });

  it("offers the Character radio-card grid with a save button", () => {
    const view = renderView();
    expect(view).toContain('role="radiogroup"');
    expect(view).toContain('role="radio"');
    expect(view).toContain("SAVE CHARACTER");
  });

  it("shows read-only account details with the account actions", () => {
    const view = renderView();
    expect(view).toContain("jai@example.com");
    expect(view).toContain("MANAGE ACCOUNT");
    expect(view).toContain("SIGN OUT");
  });

  it("shows the Badge empty state when nothing is earned", () => {
    const view = renderView({ profile: { ...profile, badges: [] } });
    expect(view).toContain(
      "No Badges earned yet — complete Quests and Codelab challenges to start earning them.",
    );
  });

  it("explains a profile that could not be loaded", () => {
    const failed = renderView({ profile: null, profileError: true });
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("Your profile could not be loaded. Please try again later.");
  });

  it("explains that the character catalog could not be loaded", () => {
    const failed = renderView({ characters: [], charactersError: true });
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("The character catalog could not be loaded. Please try again later.");
  });
});
