import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { mockGetToken, mockRefresh } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

import { QuestSessionRunner } from "./quest-session-runner";
import { SubmissionError, SubmissionResult } from "./quest-session-runner";

describe("QuestSessionRunner", () => {
  it("does not render a stray zero for an untagged question", () => {
    const markup = renderToStaticMarkup(
      <QuestSessionRunner
        questId={1}
        apiUrl="http://localhost:3001"
        session={{
          id: 2,
          questId: 1,
          title: "Loop quiz",
          description: null,
          timeLimitSeconds: 60,
          expiresAt: "2026-10-18T10:01:00.000Z",
          serverTime: "2026-10-18T10:00:00.000Z",
          questions: [
            {
              id: 3,
              prompt: "What repeats code?",
              competencies: [],
              difficulty: null,
              options: [{ id: 4, text: "A loop" }],
            },
          ],
        }}
      />,
    );

    expect(markup).toContain("What repeats code?");
    expect(markup).not.toContain("</legend>0");
  });

  it("marks the countdown as danger at ten seconds but not eleven", () => {
    const now = Date.now();
    const session = {
      id: 2,
      questId: 1,
      title: "Loop quiz",
      description: null,
      timeLimitSeconds: 60,
      serverTime: new Date(now).toISOString(),
      questions: [
        {
          id: 3,
          prompt: "What repeats code?",
          competencies: [],
          difficulty: null,
          options: [{ id: 4, text: "A loop" }],
        },
      ],
    };

    const safe = renderToStaticMarkup(
      <QuestSessionRunner
        questId={1}
        apiUrl="http://localhost:3001"
        session={{
          ...session,
          expiresAt: new Date(now + 11_000).toISOString(),
        }}
      />,
    );
    const danger = renderToStaticMarkup(
      <QuestSessionRunner
        questId={1}
        apiUrl="http://localhost:3001"
        session={{
          ...session,
          expiresAt: new Date(now + 10_000).toISOString(),
        }}
      />,
    );

    expect(safe).not.toContain("y2k-danger-pulse");
    expect(danger).toContain("y2k-danger-pulse");
  });

  it("renders passed and failed result variants with badge multiplicity", () => {
    const common = { questId: 1, title: "Loop quiz" };
    const passed = renderToStaticMarkup(
      <SubmissionResult
        {...common}
        result={{
          resultId: 7,
          score: 80,
          passed: true,
          outcome: "submitted",
          xpAwarded: 50,
          badgesEarned: [
            {
              id: 1,
              name: "Quest Master",
              description: null,
              imageUrl: null,
              awardCount: 2,
            },
          ],
        }}
      />,
    );
    const failed = renderToStaticMarkup(
      <SubmissionResult
        {...common}
        result={{
          resultId: 8,
          score: 40,
          passed: false,
          outcome: "submitted",
          xpAwarded: 0,
          badgesEarned: [],
        }}
      />,
    );

    expect(passed).toContain("QUEST PASSED!");
    expect(passed).toContain("Score: 80%");
    expect(passed).toContain("Quest Master ×2");
    expect(passed).toContain("REVIEW YOUR ANSWERS");
    expect(passed).toContain("RETAKE QUEST");
    expect(passed).toContain("BACK TO QUESTS");
    expect(failed).toContain("QUEST NOT PASSED");
    expect(failed).toContain("Score: 40%");
    expect(failed).toContain("No XP awarded");
    expect(failed).toContain("BADGES EARNED");
    expect(failed).toContain("No badges earned.");
  });

  it("renders an expired result as a failure that still shows the score", () => {
    const markup = renderToStaticMarkup(
      <SubmissionResult
        questId={1}
        title="Loop quiz"
        result={{
          resultId: 9,
          score: 0,
          passed: false,
          outcome: "expired",
          xpAwarded: 0,
          badgesEarned: [],
        }}
      />,
    );

    expect(markup).toContain("QUEST NOT PASSED");
    expect(markup).toContain("Score: 0%");
    expect(markup).toContain("TIME EXPIRED");
    expect(markup).toContain("REVIEW YOUR ANSWERS");
  });

  it("keeps the answers and offers a retry when a submission fails", () => {
    const markup = renderToStaticMarkup(
      <SubmissionError detail="Network request failed" onRetry={() => {}} />,
    );

    expect(markup).toContain(
      "Failed to submit. Your answers are still here — try again.",
    );
    expect(markup).toContain("RETRY");
    expect(markup).toContain("Network request failed");
    expect(markup).toContain('role="alert"');
  });

  it("renders the header bar with the question counter and a jump target per question", () => {
    const now = Date.now();
    const markup = renderToStaticMarkup(
      <QuestSessionRunner
        questId={1}
        apiUrl="http://localhost:3001"
        session={{
          id: 2,
          questId: 1,
          title: "Loop quiz",
          description: null,
          timeLimitSeconds: 60,
          serverTime: new Date(now).toISOString(),
          expiresAt: new Date(now + 60_000).toISOString(),
          questions: [
            {
              id: 3,
              prompt: "What repeats code?",
              competencies: [],
              difficulty: null,
              options: [{ id: 4, text: "A loop" }],
            },
            {
              id: 5,
              prompt: "What ends a loop?",
              competencies: [],
              difficulty: null,
              options: [{ id: 6, text: "A condition" }],
            },
          ],
        }}
      />,
    );

    expect(markup).toContain("Question 1 of 2 · 0 answered");
    expect(markup).toContain("Time remaining:");
    expect(markup).toContain('aria-label="Question tracker"');
    expect(markup).toContain('aria-label="Question 1: current"');
    expect(markup).toContain('aria-label="Question 2: unanswered"');
    expect(markup).toContain('aria-current="step"');
  });
});
