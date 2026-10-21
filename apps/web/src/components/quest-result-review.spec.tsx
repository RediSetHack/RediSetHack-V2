import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { QuestResultReview } from "@/lib/api-client";
import { QuestResultReviewPanel } from "./quest-result-review";

function makeReview(
  overrides: Partial<QuestResultReview> = {},
): QuestResultReview {
  return {
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
    ...overrides,
  };
}

describe("QuestResultReviewPanel summary", () => {
  it("shows the Quest title, score and outcome", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview()}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain("Loop fundamentals");
    expect(markup).toContain("Score: 50%");
    expect(markup).toContain("Not passed");
    expect(markup).toContain("Submitted");
  });

  it("shows a passed Result as Passed", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview({
          score: 90,
          passed: true,
          xpAwarded: 100,
          passingScore: 70,
        })}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain("Passed");
    expect(markup).toContain("100 XP");
    expect(markup).toContain("70%");
  });

  it("falls back to the Quest's passing score when the Result has none", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview()}
        questTitle="Loop fundamentals"
        fallbackPassingScore={60}
      />,
    );

    expect(markup).toContain("60%");
  });

  it("offers a retake and a way back to the Quests", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview()}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain("RETAKE QUEST");
    expect(markup).toContain("BACK TO QUESTS");
    expect(markup).toContain('href="/quests/1/session"');
    expect(markup).toContain('href="/quests"');
  });
});

describe("QuestResultReviewPanel question marking", () => {
  it("marks the correct answer and the learner's answer with words", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview()}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain("Correct answer");
    expect(markup).toContain("Your answer");
    expect(markup).toContain("Incorrect");
    expect(markup).toContain("What prints first?");
    expect(markup).toContain("A");
    expect(markup).toContain("B");
  });

  it("marks the answers with an icon as well as with words", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview()}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain('data-testid="option-correct"');
    expect(markup).toContain('data-testid="option-incorrect"');
    expect(markup).toContain("<svg");
  });

  it("marks a correct answer the learner chose with both words", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview({
          passed: true,
          score: 100,
          breakdown: [
            {
              questionId: 1,
              prompt: "What prints first?",
              options: [
                { id: 1, text: "A", isCorrect: true },
                { id: 2, text: "B", isCorrect: false },
              ],
              chosenOptionId: 1,
              isCorrect: true,
            },
          ],
        })}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain("Correct");
    expect(markup).toContain("Correct answer");
    expect(markup).toContain("Your answer");
    expect(markup).not.toContain('data-testid="option-incorrect"');
  });

  it("says when a question was left unanswered", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview({
          breakdown: [
            {
              questionId: 1,
              prompt: "What prints first?",
              options: [{ id: 1, text: "A", isCorrect: true }],
              chosenOptionId: null,
              isCorrect: false,
            },
          ],
        })}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain("Not answered");
    expect(markup).toContain("Correct answer");
  });

  it("shows an empty state when the Result has no questions", () => {
    const markup = renderToStaticMarkup(
      <QuestResultReviewPanel
        review={makeReview({ breakdown: [] })}
        questTitle="Loop fundamentals"
      />,
    );

    expect(markup).toContain("No questions to review.");
  });
});
