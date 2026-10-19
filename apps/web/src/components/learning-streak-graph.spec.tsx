import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LearningStreakGraph } from "./learning-streak-graph";

const streak = {
  timeZone: "Asia/Manila" as const,
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

describe("LearningStreakGraph", () => {
  it("states streaks and per-day activity in text, not only colour", () => {
    const markup = renderToStaticMarkup(<LearningStreakGraph streak={streak} />);
    expect(markup).toContain("Current streak: <strong>2 days</strong>");
    expect(markup).toContain("Longest streak: <strong>5 days</strong>");
    expect(markup).toContain("2026-10-17: 2 accomplishments (1 reading, 1 assessed)");
    expect(markup).toContain("2026-10-19: 0 accomplishments (0 reading, 0 assessed)");
  });

  it("shows an alert when history cannot be loaded", () => {
    expect(renderToStaticMarkup(<LearningStreakGraph streak={null} />)).toContain('role="alert"');
  });
});
