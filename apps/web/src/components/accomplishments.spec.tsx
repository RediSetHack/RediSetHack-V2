import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AccomplishmentSummary } from "./accomplishments";

const summary = {
  adventurerRank: 4,
  totalXp: 1240,
  accomplishments: { novelsCompleted: 3, sideQuestsCompleted: 5, ctfsSolved: 2 },
  badges: [
    { count: 3 },
    { count: 2 },
  ],
};

describe("AccomplishmentSummary stat tiles", () => {
  it("shows the four PAGES.md §14 tiles with their counts", () => {
    const html = renderToStaticMarkup(<AccomplishmentSummary summary={summary} />);

    expect(html).toContain("Stages completed");
    expect(html).toContain("Quests passed");
    expect(html).toContain("Badges");
    expect(html).toContain("Rank");
    expect(html).toContain("3");
    expect(html).toContain("5");
    expect(html).toContain("#4");
    expect(html).toContain("1,240 XP");
  });

  it("counts Badges with multiplicity instead of badge types", () => {
    const html = renderToStaticMarkup(<AccomplishmentSummary summary={summary} />);
    // 3 + 2 awards = 5 badges earned, shown next to the "Badges" tile.
    expect(html).toMatch(/Badges<\/p><p[^>]*>5</);
  });

  it("keeps the CTF evidence count in text", () => {
    const html = renderToStaticMarkup(<AccomplishmentSummary summary={summary} />);
    expect(html).toContain("CTF challenges solved: 2");
  });

  it("renders an accessible empty state when nothing is completed", () => {
    const html = renderToStaticMarkup(
      <AccomplishmentSummary
        summary={{
          ...summary,
          accomplishments: { novelsCompleted: 0, sideQuestsCompleted: 0, ctfsSolved: 0 },
          badges: [],
        }}
      />,
    );
    expect(html).toContain("No completed Novels, Side Quests or CTF challenges yet");
  });
});
