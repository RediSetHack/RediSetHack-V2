import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProfileView } from "./profile-view";
import { profileFixture, streakFixture } from "@/test/fixtures";
import type { CharacterOption } from "@/lib/api-client";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("tok") }),
  useClerk: () => ({ signOut: vi.fn(), openUserProfile: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const characters: CharacterOption[] = [
  { id: 1, name: "Kalayaan", slug: "kalayaan", description: "The coder", imageUrl: null },
  { id: 2, name: "Ada", slug: "ada", description: "The first programmer", imageUrl: null },
];

type ViewOverrides = Partial<Parameters<typeof ProfileView>[0]>;

function renderView(overrides: ViewOverrides = {}) {
  return renderToStaticMarkup(
    <ProfileView
      profile={profileFixture}
      profileError={false}
      streak={streakFixture}
      characters={characters}
      charactersError={false}
      badgeDescriptions={{ "pull-shark": "Earned for pulling three quests" }}
      account={{ name: "Jai", email: "jai@example.com" }}
      apiUrl="http://localhost:3001"
      {...overrides}
    />,
  );
}

/** Every rendering of the Profile, with the text it has to show. */
const cases: ReadonlyArray<{
  label: string;
  overrides: ViewOverrides;
  expected: readonly string[];
}> = [
  {
    label: "the Profile windows",
    overrides: {},
    expected: [
      "CHARACTER.EXE",
      "STATS.EXE",
      "LEARNING_STREAK.EXE",
      "BADGES.EXE",
      "CHANGE_CHARACTER.EXE",
      "ACCOUNT.EXE",
      "SHARED_PROFILE.EXE",
    ],
  },
  {
    label: "the Character summary",
    overrides: {},
    expected: [
      "Kalayaan",
      "Adventurer Rank 4",
      "1,240 XP",
      'aria-label="XP to Adventurer Rank 5"',
    ],
  },
  {
    label: "the stat tiles",
    overrides: {},
    expected: ["Stages completed", "Quests passed", "Badges", "Rank"],
  },
  {
    label: "the Badge tiles",
    overrides: {},
    expected: ["Pull Shark", "Earned ×3", "Earned for pulling three quests"],
  },
  {
    label: "the Learning Streak counts",
    overrides: {},
    expected: [
      "Current streak: <strong>1 day</strong>",
      "Longest streak: <strong>3 days</strong>",
    ],
  },
  {
    label: "the Character radio-card grid",
    overrides: {},
    expected: ['role="radiogroup"', 'role="radio"', "SAVE CHARACTER"],
  },
  {
    label: "the account details",
    overrides: {},
    expected: ["jai@example.com", "MANAGE ACCOUNT", "SIGN OUT"],
  },
  {
    label: "the Badge empty state",
    overrides: { profile: { ...profileFixture, badges: [] } },
    expected: [
      "No Badges earned yet — complete Quests and Codelab challenges to start earning them.",
    ],
  },
  {
    label: "a profile that could not be loaded",
    overrides: { profile: null, profileError: true },
    expected: [
      'role="alert"',
      "Your profile could not be loaded. Please try again later.",
    ],
  },
  {
    label: "a character catalog that could not be loaded",
    overrides: { characters: [], charactersError: true },
    expected: [
      'role="alert"',
      "The character catalog could not be loaded. Please try again later.",
    ],
  },
];

describe("ProfileView (PAGES.md §14)", () => {
  it.each(cases)("shows $label", ({ overrides, expected }) => {
    const view = renderView(overrides);
    for (const text of expected) {
      expect(view).toContain(text);
    }
  });
});
