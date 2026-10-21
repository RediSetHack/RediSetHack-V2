import { describe, expect, it } from "vitest";

import type { Quest } from "@/lib/api-client";
import {
  bestResultLabel,
  filterQuests,
  questOutcome,
  startQuestConfirmCopy,
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

describe("questOutcome", () => {
  it("reports a Quest the learner never took as not taken", () => {
    expect(questOutcome(makeQuest())).toBe("not-taken");
    expect(questOutcome(makeQuest({ bestResult: undefined }))).toBe("not-taken");
  });

  it("reports a failed best Result as not passed", () => {
    expect(
      questOutcome(makeQuest({ bestResult: { score: 40, passed: false } })),
    ).toBe("not-passed");
  });

  it("reports a passed best Result as passed", () => {
    expect(
      questOutcome(makeQuest({ bestResult: { score: 90, passed: true } })),
    ).toBe("passed");
  });
});

describe("bestResultLabel", () => {
  it("shows the score behind a passed Result", () => {
    expect(
      bestResultLabel(makeQuest({ bestResult: { score: 90, passed: true } })),
    ).toBe("Passed 90%");
  });

  it("shows a failed Result without a score", () => {
    expect(
      bestResultLabel(makeQuest({ bestResult: { score: 40, passed: false } })),
    ).toBe("Not passed");
  });

  it("shows a Quest never taken", () => {
    expect(bestResultLabel(makeQuest())).toBe("Not taken");
  });
});

describe("filterQuests", () => {
  const quests = [
    makeQuest({
      id: 1,
      title: "Loop fundamentals",
      description: "Covers for and while loops.",
      bestResult: null,
    }),
    makeQuest({
      id: 2,
      title: "Conditionals",
      description: "if, else and switch.",
      bestResult: { score: 40, passed: false },
    }),
    makeQuest({
      id: 3,
      title: "Functions",
      description: "Reusable blocks of code.",
      bestResult: { score: 90, passed: true },
    }),
  ];

  it("keeps every Quest on the All tab", () => {
    expect(filterQuests(quests, "all", "")).toHaveLength(3);
  });

  it("keeps only never-taken Quests on the Not taken tab", () => {
    expect(
      filterQuests(quests, "not-taken", "").map((quest) => quest.id),
    ).toEqual([1]);
  });

  it("keeps only passed Quests on the Passed tab", () => {
    expect(filterQuests(quests, "passed", "").map((quest) => quest.id)).toEqual([
      3,
    ]);
  });

  it("matches the search against the title", () => {
    expect(
      filterQuests(quests, "all", "condition").map((quest) => quest.id),
    ).toEqual([2]);
  });

  it("matches the search against the description", () => {
    expect(
      filterQuests(quests, "all", "reusable").map((quest) => quest.id),
    ).toEqual([3]);
  });

  it("ignores the case and the surrounding spaces of the search", () => {
    expect(
      filterQuests(quests, "all", "  FUNCTIONS ").map((quest) => quest.id),
    ).toEqual([3]);
  });

  it("combines the tab and the search", () => {
    expect(filterQuests(quests, "passed", "loop")).toHaveLength(0);
    expect(
      filterQuests(quests, "not-taken", "loop").map((quest) => quest.id),
    ).toEqual([1]);
  });
});

describe("startQuestConfirmCopy", () => {
  it("names the Quest and warns that the timer starts immediately", () => {
    expect(startQuestConfirmCopy(makeQuest())).toEqual({
      title: "Start Loop fundamentals?",
      message:
        "You have 05:00. The timer starts immediately and submits automatically at zero.",
    });
  });

  it("formats a sub-minute time limit as mm:ss", () => {
    expect(
      startQuestConfirmCopy(makeQuest({ timeLimitSeconds: 90 })).message,
    ).toContain("You have 01:30.");
  });
});
