import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import type { SideQuest, SideQuestListItem } from "@/lib/api-client";
import { SideQuestDetail, SideQuestList } from "./side-quests";

function makeListItem(
  overrides: Partial<SideQuestListItem> = {},
): SideQuestListItem {
  return {
    id: 1,
    title: "Cache the answer",
    summary: "An optional objective.",
    xpReward: 40,
    status: "available",
    lockReasons: [],
    ...overrides,
  };
}

function makeDetail(overrides: Partial<SideQuest> = {}): SideQuest {
  return {
    ...makeListItem(),
    requirements: [],
    brief: "Work through the cache lab.",
    activity: null,
    ...overrides,
  };
}

describe("Side Quest requirements", () => {
  it("states a met requirement with a check icon and the state in text", () => {
    const markup = renderToStaticMarkup(
      <SideQuestDetail
        error={false}
        detail={makeDetail({
          requirements: [{ type: "level", message: "Reach level 3", met: true }],
        })}
      />,
    );

    expect(markup).toContain("lucide-check");
    expect(markup).toContain("Requirement met");
    expect(markup).toContain("Reach level 3");
    expect(markup).not.toContain("Requirement not met");
  });

  it("states an unmet requirement with an x icon and the state in text", () => {
    const markup = renderToStaticMarkup(
      <SideQuestDetail
        error={false}
        detail={makeDetail({
          requirements: [
            { type: "badge", message: "Earn the Debugger badge", met: false },
          ],
        })}
      />,
    );

    expect(markup).toContain("lucide-x");
    expect(markup).toContain("Requirement not met");
    expect(markup).toContain("Earn the Debugger badge");
    expect(markup).not.toContain("Requirement met<");
  });

  it("shows every requirement of a Side Quest", () => {
    const markup = renderToStaticMarkup(
      <SideQuestDetail
        error={false}
        detail={makeDetail({
          requirements: [
            { type: "level", message: "Reach level 3", met: true },
            { type: "badge", message: "Earn the Debugger badge", met: false },
          ],
        })}
      />,
    );

    expect(markup).toContain("Requirement met");
    expect(markup).toContain("Requirement not met");
  });
});

describe("Side Quest list", () => {
  it("shows the lock reasons with a lock icon and the reason in text", () => {
    const markup = renderToStaticMarkup(
      <SideQuestList
        error={false}
        quests={[
          makeListItem({
            status: "locked",
            lockReasons: [
              { type: "level", message: "Reach level 5 to unlock this Side Quest." },
            ],
          }),
        ]}
      />,
    );

    expect(markup).toContain("lucide-lock");
    expect(markup).toContain("Reach level 5 to unlock this Side Quest.");
    expect(markup).toContain("Locked");
  });

  it("labels a started Side Quest as in progress", () => {
    const markup = renderToStaticMarkup(
      <SideQuestList
        error={false}
        quests={[makeListItem({ status: "in_progress" })]}
      />,
    );

    expect(markup).toContain("In progress");
  });

  it("links every Side Quest to its detail", () => {
    const markup = renderToStaticMarkup(
      <SideQuestList error={false} quests={[makeListItem({ id: 7 })]} />,
    );

    expect(markup).toContain('href="/side-quests?quest=7"');
  });
});

describe("Side Quest detail", () => {
  it("links to the activity of the Side Quest", () => {
    const markup = renderToStaticMarkup(
      <SideQuestDetail
        error={false}
        detail={makeDetail({ activity: { type: "ctf", id: 7 } })}
      />,
    );

    expect(markup).toContain("OPEN ACTIVITY");
    expect(markup).toContain('href="/ctf?challenge=7"');
  });

  it("shows the error state when the Side Quest could not be loaded", () => {
    const markup = renderToStaticMarkup(
      <SideQuestDetail error={true} detail={null} />,
    );

    expect(markup).toContain(
      "This Side Quest could not be loaded. Please try again later.",
    );
  });
});

describe("Side Quest list states", () => {
  it("shows the empty state when there are no Side Quests", () => {
    const markup = renderToStaticMarkup(
      <SideQuestList error={false} quests={[]} />,
    );

    expect(markup).toContain("No Side Quests yet.");
  });

  it("shows the error state when the Side Quests could not be loaded", () => {
    const markup = renderToStaticMarkup(
      <SideQuestList error={true} quests={null} />,
    );

    expect(markup).toContain(
      "Side Quests could not be loaded. Please try again later.",
    );
  });
});
