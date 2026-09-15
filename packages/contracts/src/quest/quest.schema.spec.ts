import { describe, expect, it } from "vitest";
import { QuestListResponseSchema, QuestSchema } from "./quest.schema.js";

describe("QuestSchema", () => {
  it("parses a valid Quest payload", () => {
    const payload = {
      id: 1,
      stageId: 1,
      title: "Loop fundamentals",
      description: "Covers for and while loops.",
      timeLimitSeconds: 300,
      passingScore: 70,
      xpReward: 100,
      completed: false,
    };

    expect(QuestSchema.parse(payload)).toEqual(payload);
  });

  it("allows a null description", () => {
    const payload = {
      id: 1,
      stageId: 1,
      title: "Loop fundamentals",
      description: null,
      timeLimitSeconds: 300,
      passingScore: 70,
      xpReward: 100,
      completed: true,
    };

    expect(QuestSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => QuestSchema.parse({ id: 1, completed: "yes" })).toThrow();
  });
});

describe("QuestListResponseSchema", () => {
  it("parses an array of Quests", () => {
    const payload = [
      {
        id: 1,
        stageId: 1,
        title: "Loop fundamentals",
        description: null,
        timeLimitSeconds: 300,
        passingScore: 70,
        xpReward: 100,
        completed: false,
      },
    ];

    expect(QuestListResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses an empty Quest list", () => {
    expect(QuestListResponseSchema.parse([])).toEqual([]);
  });
});
