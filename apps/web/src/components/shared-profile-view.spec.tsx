import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SharedProfileView } from "./shared-profile-view";
import { AccomplishmentSummary } from "./accomplishments";

const profile = {
  adventurerRank: 3,
  totalXp: 450,
  character: { name: "Kalayaan", slug: "kalayaan", imageUrl: null },
  badges: [{ name: "Pull Shark", slug: "pull-shark", imageUrl: null, count: 3 }],
  accomplishments: { novelsCompleted: 1, sideQuestsCompleted: 2, ctfsSolved: 0 },
  currentStreak: 2,
  longestStreak: 5,
};

describe("SharedProfileView", () => {
  it("shows the approved summary with Badge multiplicity", () => {
    const html = renderToStaticMarkup(<SharedProfileView profile={profile} error={false} />);
    expect(html).toContain("Rank");
    expect(html).toContain("Stages completed");
    expect(html).toContain("Quests passed");
    expect(html).toContain("Earned ×3");
  });

  it("shows the Character and the streak counts in text", () => {
    const html = renderToStaticMarkup(<SharedProfileView profile={profile} error={false} />);
    expect(html).toContain("Kalayaan");
    expect(html).toContain("Adventurer Rank 3");
    expect(html).toContain("Current: 2 • Longest: 5 days");
  });

  it("renders the Badge empty state", () => {
    const html = renderToStaticMarkup(
      <SharedProfileView profile={{ ...profile, badges: [] }} error={false} />,
    );
    expect(html).toContain("No Badges earned yet.");
  });

  it("explains a revoked/unknown link and announces a load failure", () => {
    expect(renderToStaticMarkup(<SharedProfileView profile={null} error={false} />)).toContain("revoked");
    expect(renderToStaticMarkup(<SharedProfileView profile={null} error />)).toContain('role="alert"');
  });
});

describe("AccomplishmentSummary", () => {
  it("renders an accessible empty state", () => {
    const html = renderToStaticMarkup(<AccomplishmentSummary summary={{ ...profile, accomplishments: { novelsCompleted: 0, sideQuestsCompleted: 0, ctfsSolved: 0 } }} />);
    expect(html).toContain("No completed Novels, Side Quests or CTF challenges yet");
  });
});
