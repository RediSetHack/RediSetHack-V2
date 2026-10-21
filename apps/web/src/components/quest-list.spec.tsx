import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/y2k-dialog", () => ({
  ConfirmDialog: ({
    title,
    message,
    confirmLabel,
    cancelLabel,
  }: {
    title: string;
    message: ReactNode;
    confirmLabel: string;
    cancelLabel: string;
  }) => (
    <div data-testid="confirm-dialog">
      <p>{title}</p>
      <div>{message}</div>
      <button type="button">{cancelLabel}</button>
      <button type="button">{confirmLabel}</button>
    </div>
  ),
  ErrorAlert: ({ message }: { message: string }) => (
    <div role="alert">
      <p>{message}</p>
    </div>
  ),
}));

import type { Quest } from "@/lib/api-client";
import {
  QuestFilterTabs,
  QuestList,
  StartQuestDialogBody,
} from "./quest-list";

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 1,
    stageId: 10,
    title: "Loop fundamentals",
    description: "Covers for and while loops.",
    timeLimitSeconds: 300,
    passingScore: 70,
    xpReward: 100,
    initialAssessment: false,
    completed: false,
    bestResult: null,
    lockReason: null,
    ...overrides,
  };
}

describe("Quest card fields", () => {
  it("shows the title, description, time limit, passing score and XP reward", () => {
    const markup = renderToStaticMarkup(
      <QuestList quests={[makeQuest()]} error={false} />,
    );

    expect(markup).toContain("Loop fundamentals");
    expect(markup).toContain("Covers for and while loops.");
    expect(markup).toContain("05:00");
    expect(markup).toContain("Pass 70%");
    expect(markup).toContain("100 XP");
    expect(markup).toContain("START");
  });

  it("shows the best Result chip with the score of a passed Quest", () => {
    const markup = renderToStaticMarkup(
      <QuestList
        quests={[makeQuest({ bestResult: { score: 90, passed: true } })]}
        error={false}
      />,
    );

    expect(markup).toContain("Passed 90%");
  });

  it("shows a failed Quest as Not passed", () => {
    const markup = renderToStaticMarkup(
      <QuestList
        quests={[makeQuest({ bestResult: { score: 40, passed: false } })]}
        error={false}
      />,
    );

    expect(markup).toContain("Not passed");
    expect(markup).not.toContain("Passed 40%");
  });

  it("shows a Quest never taken as Not taken", () => {
    const markup = renderToStaticMarkup(
      <QuestList quests={[makeQuest()]} error={false} />,
    );

    expect(markup).toContain("Not taken");
  });
});

describe("QuestFilterTabs", () => {
  it("marks the active tab as pressed", () => {
    const markup = renderToStaticMarkup(
      <QuestFilterTabs filter="passed" onChange={() => {}} />,
    );

    expect(markup).toContain("Passed");
    expect(markup).toContain("Not taken");
    expect(markup).toContain("All");
    expect(markup).toMatch(/aria-pressed="true"[^>]*>Passed</);
    expect(markup).toMatch(/aria-pressed="false"[^>]*>All</);
  });
});

describe("Start confirmation copy", () => {
  it("warns that the timer starts immediately and shows the Quest's time", () => {
    const markup = renderToStaticMarkup(
      <StartQuestDialogBody quest={makeQuest()} />,
    );

    expect(markup).toContain(
      "You have 05:00. The timer starts immediately and submits automatically at zero.",
    );
  });
});

describe("QuestList states", () => {
  it("shows an error message when the Quests could not be loaded", () => {
    const markup = renderToStaticMarkup(<QuestList quests={null} error={true} />);

    expect(markup).toContain("Quests could not be loaded. Please try again later.");
  });

  it("shows the empty state when there are no Quests at all", () => {
    const markup = renderToStaticMarkup(
      <QuestList quests={[]} error={false} />,
    );

    expect(markup).toContain("No Quests available.");
  });

  it("offers a search box for the loaded Quests", () => {
    const markup = renderToStaticMarkup(
      <QuestList quests={[makeQuest()]} error={false} />,
    );

    expect(markup).toContain("Search quests…");
  });
});
