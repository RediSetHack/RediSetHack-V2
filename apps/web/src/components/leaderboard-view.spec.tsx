import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import type { Leaderboard, LeaderboardEntry } from "@/lib/api-client";
import { LeaderboardView } from "./leaderboard-view";

function makeEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    userId: "user-1",
    name: "Ada Lovelace",
    totalXp: 1240,
    level: 4,
    ...overrides,
  };
}

function makeLeaderboard(overrides: Partial<Leaderboard> = {}): Leaderboard {
  return {
    page: 1,
    limit: 20,
    total: 3,
    entries: [
      makeEntry({ rank: 1, userId: "user-1", name: "Ada Lovelace", totalXp: 1240, level: 4 }),
      makeEntry({ rank: 2, userId: "user-2", name: "Grace Hopper", totalXp: 900, level: 3 }),
      makeEntry({ rank: 3, userId: "user-3", name: "Alan Turing", totalXp: 640, level: 3 }),
    ],
    ...overrides,
  };
}

/** The markup of the element that holds `needle`, from its opening tag. */
function elementAround(markup: string, needle: string, tag: string): string {
  const index = markup.indexOf(needle);
  expect(index, `expected to find ${needle}`).toBeGreaterThan(-1);
  const start = markup.lastIndexOf(`<${tag}`, index);
  const end = markup.indexOf(`</${tag}>`, index);
  return markup.slice(start, end);
}

describe("Leaderboard podium", () => {
  it("shows the top three of page 1", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId={null} />,
    );

    expect(markup).toContain("1ST PLACE");
    expect(markup).toContain("2ND PLACE");
    expect(markup).toContain("3RD PLACE");
    expect(markup).toContain("Ada Lovelace");
    expect(markup).toContain("Grace Hopper");
    expect(markup).toContain("Alan Turing");
  });

  it("centres the first place and makes it the tallest card", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId={null} />,
    );

    const first = elementAround(markup, "1ST PLACE", "li");
    const second = elementAround(markup, "2ND PLACE", "li");
    const third = elementAround(markup, "3RD PLACE", "li");

    expect(first).toContain("sm:order-2");
    expect(first).toContain("size-16");
    expect(second).toContain("sm:order-1");
    expect(second).toContain("size-12");
    expect(third).toContain("sm:order-3");
    expect(third).toContain("size-12");
  });

  it("hides the podium after the first page", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView
        leaderboard={makeLeaderboard({
          page: 2,
          total: 40,
          entries: [makeEntry({ rank: 21, userId: "user-21" })],
        })}
        error={false}
        currentUserId={null}
      />,
    );

    expect(markup).not.toContain("1ST PLACE");
    expect(markup).not.toContain("PLACE");
  });

  it("only shows the places that exist", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView
        leaderboard={makeLeaderboard({
          total: 2,
          entries: [
            makeEntry({ rank: 1, userId: "user-1" }),
            makeEntry({ rank: 2, userId: "user-2", name: "Grace Hopper" }),
          ],
        })}
        error={false}
        currentUserId={null}
      />,
    );

    expect(markup).toContain("1ST PLACE");
    expect(markup).toContain("2ND PLACE");
    expect(markup).not.toContain("3RD PLACE");
  });

  it("falls back to Anonymous and shows the level and the XP of each learner", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView
        leaderboard={makeLeaderboard({
          entries: [makeEntry({ rank: 1, userId: "user-1", name: null, level: 2, totalXp: 150 })],
        })}
        error={false}
        currentUserId={null}
      />,
    );

    expect(markup).toContain("Anonymous");
    expect(markup).toContain("LV 2");
    expect(markup).toContain("150 XP");
  });
});

describe("Leaderboard ranking table", () => {
  it("lists the rank, the name, the level and the XP", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId={null} />,
    );

    expect(markup).toContain(">Rank<");
    expect(markup).toContain(">Name<");
    expect(markup).toContain(">Level<");
    expect(markup).toContain(">XP<");
    expect(markup).toContain("LV 3");
    expect(markup).toContain("900 XP");
  });

  it("highlights the current learner's row and marks it as (you)", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId="user-2" />,
    );

    const row = elementAround(markup, "(you)", "tr");
    expect(row).toContain("bg-accent/40");
    expect(row).toContain('aria-current="true"');
    expect(row).toContain("Grace Hopper");
  });

  it("leaves the other rows unmarked", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId="user-2" />,
    );

    const row = elementAround(markup, "Ada Lovelace", "tr");
    expect(row).not.toContain("(you)");
    expect(row).not.toContain("aria-current");
  });
});

describe("Leaderboard pager", () => {
  it("shows the page count and disables previous on the first page", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView
        leaderboard={makeLeaderboard({ total: 60 })}
        error={false}
        currentUserId={null}
      />,
    );

    expect(markup).toContain("Page 1 of 3");
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).toContain('href="?page=2"');
  });

  it("disables next on the last page", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView
        leaderboard={makeLeaderboard({ page: 3, total: 60 })}
        error={false}
        currentUserId={null}
      />,
    );

    expect(markup).toContain("Page 3 of 3");
    expect(markup).toContain('href="?page=2"');
    expect(markup).toContain('aria-disabled="true"');
  });
});

describe("Your rank card", () => {
  it("pins the rank and the XP of the signed-in learner", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId="user-2" />,
    );

    expect(markup).toContain("YOUR RANK #2 · 900 XP");
  });

  it("stays visible while the leaderboard scrolls", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId="user-2" />,
    );

    expect(markup).toContain("sticky bottom-4");
  });

  it("is hidden when the signed-in learner is not on this page", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={makeLeaderboard()} error={false} currentUserId="user-99" />,
    );

    expect(markup).not.toContain("YOUR RANK #");
  });
});

describe("Leaderboard states", () => {
  it("shows the empty state when nobody has earned XP yet", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView
        leaderboard={makeLeaderboard({ total: 0, entries: [] })}
        error={false}
        currentUserId={null}
      />,
    );

    expect(markup).toContain("No one has earned XP yet.");
  });

  it("shows the error state with a retry when the leaderboard fails to load", () => {
    const markup = renderToStaticMarkup(
      <LeaderboardView leaderboard={null} error currentUserId={null} />,
    );

    expect(markup).toContain("The leaderboard could not be loaded. Please try again.");
    expect(markup).toContain("Try again");
  });
});
