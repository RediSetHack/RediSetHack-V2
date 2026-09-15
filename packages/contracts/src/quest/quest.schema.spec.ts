import { describe, expect, it } from "vitest";
import {
  QuestListResponseSchema,
  QuestResultReviewResponseSchema,
  QuestSchema,
  QuestSessionResponseSchema,
  SubmitQuestResponseSchema,
} from "./quest.schema.js";

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

describe("QuestSessionResponseSchema", () => {
  it("parses a started Quest Session with correct answers withheld", () => {
    const payload = {
      id: 1,
      title: "Loop fundamentals",
      description: "Covers for and while loops.",
      timeLimitSeconds: 300,
      expiresAt: "2026-09-15T12:05:00.000Z",
      questions: [
        {
          id: 1,
          prompt: "What prints first?",
          options: [
            { id: 1, text: "A" },
            { id: 2, text: "B" },
          ],
        },
      ],
    };

    expect(QuestSessionResponseSchema.parse(payload)).toEqual(payload);
  });

  it("rejects an option carrying isCorrect", () => {
    const payload = {
      id: 1,
      title: "Loop fundamentals",
      description: null,
      timeLimitSeconds: 300,
      expiresAt: "2026-09-15T12:05:00.000Z",
      questions: [
        { id: 1, prompt: "?", options: [{ id: 1, text: "A", isCorrect: true }] },
      ],
    };

    // Zod strips unknown keys by default rather than rejecting them, so this
    // asserts the withheld field never survives parsing.
    const parsed = QuestSessionResponseSchema.parse(payload);
    expect(parsed.questions[0]?.options[0]).not.toHaveProperty("isCorrect");
  });
});

describe("SubmitQuestResponseSchema", () => {
  it("parses a passing submission with a Badge earned", () => {
    const payload = {
      resultId: 5,
      score: 100,
      passed: true,
      xpAwarded: 50,
      badgesEarned: [
        {
          id: 1,
          name: "Quest Novice",
          description: null,
          imageUrl: null,
          awardCount: 1,
        },
      ],
    };

    expect(SubmitQuestResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses a retake that passed with zero XP and no Badges", () => {
    const payload = {
      resultId: 6,
      score: 100,
      passed: true,
      xpAwarded: 0,
      badgesEarned: [],
    };

    expect(SubmitQuestResponseSchema.parse(payload)).toEqual(payload);
  });
});

describe("QuestResultReviewResponseSchema", () => {
  it("parses a Result review with correct answers now visible", () => {
    const payload = {
      resultId: 5,
      questId: 1,
      score: 50,
      passed: false,
      submittedAt: "2026-09-15T12:04:00.000Z",
      breakdown: [
        {
          questionId: 1,
          prompt: "What prints first?",
          options: [
            { id: 1, text: "A", isCorrect: true },
            { id: 2, text: "B", isCorrect: false },
          ],
          chosenOptionId: 2,
          isCorrect: false,
        },
      ],
    };

    expect(QuestResultReviewResponseSchema.parse(payload)).toEqual(payload);
  });

  it("allows a null chosenOptionId for an unanswered question", () => {
    const payload = {
      resultId: 5,
      questId: 1,
      score: 0,
      passed: false,
      submittedAt: "2026-09-15T12:04:00.000Z",
      breakdown: [
        {
          questionId: 1,
          prompt: "What prints first?",
          options: [{ id: 1, text: "A", isCorrect: true }],
          chosenOptionId: null,
          isCorrect: false,
        },
      ],
    };

    expect(QuestResultReviewResponseSchema.parse(payload)).toEqual(payload);
  });
});
