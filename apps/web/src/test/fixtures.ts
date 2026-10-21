import type { LearningStreak, Profile, SharedProfile } from "@/lib/api-client";

/**
 * Fixtures shared by the Profile and Shared Profile specs, so the same
 * learner is not described twice in two files.
 */

/** A learner with a Character, some evidence, one Badge and a shared link. */
export const profileFixture: Profile = {
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

/** The public summary of the same learner. */
export const sharedProfileFixture: SharedProfile = {
  adventurerRank: 3,
  totalXp: 450,
  character: { name: "Kalayaan", slug: "kalayaan", imageUrl: null },
  badges: [{ name: "Pull Shark", slug: "pull-shark", imageUrl: null, count: 3 }],
  accomplishments: { novelsCompleted: 1, sideQuestsCompleted: 2, ctfsSolved: 0 },
  currentStreak: 2,
  longestStreak: 5,
};

/** One Learning Day, so the Contribution Graph has a cell to draw. */
export const streakFixture: LearningStreak = {
  timeZone: "Asia/Manila",
  today: "2026-10-20",
  from: "2026-10-20",
  to: "2026-10-20",
  currentStreak: 1,
  longestStreak: 3,
  days: [{ date: "2026-10-20", reading: 1, assessed: 0 }],
};
