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
import { SubmissionResult } from "./quest-session-runner";

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
    expect(passed).toContain("Quest Master ×2");
    expect(passed).toContain("REVIEW YOUR ANSWERS");
    expect(failed).toContain("QUEST NOT PASSED");
    expect(failed).toContain("No XP awarded");
    expect(failed).toContain("BADGES EARNED");
  });
});
