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

const renderedExpectations = [
  [
    "the Profile windows",
    [
      "CHARACTER.EXE",
      "STATS.EXE",
      "LEARNING_STREAK.EXE",
      "BADGES.EXE",
      "CHANGE_CHARACTER.EXE",
      "ACCOUNT.EXE",
      "SHARED_PROFILE.EXE",
    ],
  ],
  [
    "the Character summary",
    [
      "Kalayaan",
      "Adventurer Rank 4",
      "1,240 XP",
      'aria-label="XP to Adventurer Rank 5"',
    ],
  ],
  ["the stat tiles", ["Stages completed", "Quests passed", "Badges", "Rank"]],
  [
    "the Badge tiles",
    ["Pull Shark", "Earned ×3", "Earned for pulling three quests"],
  ],
  [
    "the Learning Streak counts",
    [
      "Current streak: <strong>2 days</strong>",
      "Longest streak: <strong>5 days</strong>",
    ],
  ],
  [
    "the Character radio-card grid",
    ['role="radiogroup"', 'role="radio"', "SAVE CHARACTER"],
  ],
  ["the account details", ["jai@example.com", "MANAGE ACCOUNT", "SIGN OUT"]],
] as const;

describe("ProfileView (PAGES.md §14)", () => {
  it.each(renderedExpectations)("shows %s", (_label, expected) => {
    const view = renderView();
    for (const text of expected) {
      expect(view).toContain(text);
    }
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
    expect(failed).toContain(
      "The character catalog could not be loaded. Please try again later.",
    );
  });
});
