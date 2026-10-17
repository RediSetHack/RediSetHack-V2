import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { mockGetToken, mockRefresh } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: mockGetToken }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

import { QuestSessionRunner } from "./quest-session-runner";

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
          questions: [{ id: 3, prompt: "What repeats code?", competencies: [], difficulty: null, options: [{ id: 4, text: "A loop" }] }],
        }}
      />,
    );

    expect(markup).toContain("What repeats code?");
    expect(markup).not.toContain("</legend>0");
  });
});
