import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/y2k-dialog", () => ({
  Y2kDialog: ({ actions }: { actions: ReactNode }) => <div>{actions}</div>,
}));

import { StageCompletion, CompletionDialogBody } from "./stage-completion";
import type { StageCompletion as CompletionResult } from "@/lib/api-client";

function makeResult(overrides: Partial<CompletionResult> = {}): CompletionResult {
  return {
    stageId: 1,
    xpEarned: 50,
    eventMultiplier: 1,
    eventType: "normal",
    level: 2,
    leveledUp: false,
    badgesEarned: [],
    ...overrides,
  };
}

describe("Stage completion navigation", () => {
  it("links to the successor when the Zone has another Stage", () => {
    const markup = renderToStaticMarkup(<StageCompletion stageId={1} apiUrl="http://api.test" completed={false} zonePath="/map/1/2" nextStagePath="/map/1/2/3" />);
    expect(markup).toMatch(/href="\/map\/1\/2\/3"[^>]*>NEXT STAGE<\/a>/);
    expect(markup).toContain('href="/map/1/2"');
  });

  it("offers only the Zone link at the end", () => {
    const markup = renderToStaticMarkup(<StageCompletion stageId={1} apiUrl="http://api.test" completed={false} zonePath="/map/1/2" />);
    expect(markup).not.toContain("NEXT STAGE");
    expect(markup).toContain("BACK TO ZONE");
  });

  it("shows the no-XP notice instead of the button for a completed Stage", () => {
    const markup = renderToStaticMarkup(<StageCompletion stageId={1} apiUrl="http://api.test" completed={true} zonePath="/map/1/2" />);
    expect(markup).toContain("Already completed — reading it again awards no XP.");
    expect(markup).not.toContain("MARK AS COMPLETE");
  });
});

describe("Stage completion dialog content", () => {
  it("shows the awarded XP and the next Stage", () => {
    const markup = renderToStaticMarkup(
      <CompletionDialogBody
        result={makeResult({ xpEarned: 50 })}
        nextStagePath="/map/1/2/3"
        nextStageTitle="Stage 3"
        totalXpBefore={150}
      />,
    );
    expect(markup).toContain("+50 XP");
    expect(markup).toContain("Next Stage unlocked: Stage 3");
  });

  it("shows the Bonus multiplier when a bonus Event awarded the XP", () => {
    const markup = renderToStaticMarkup(
      <CompletionDialogBody
        result={makeResult({ xpEarned: 100, eventType: "bonus", eventMultiplier: 2 })}
        nextStagePath="/map/1/2/3"
        totalXpBefore={150}
      />,
    );
    expect(markup).toContain("+100 XP");
    expect(markup).toContain("Bonus ×2");
  });

  it("notes when the Zone is cleared with no successor", () => {
    const markup = renderToStaticMarkup(<CompletionDialogBody result={makeResult()} />);
    expect(markup).toContain("Zone cleared — all Stages completed!");
    expect(markup).not.toContain("NEXT STAGE");
  });

  it("celebrates a level-up and lists earned Badges", () => {
    const markup = renderToStaticMarkup(
      <CompletionDialogBody
        result={makeResult({
          leveledUp: true,
          level: 3,
          badgesEarned: [{ id: 1, name: "Loop Master", description: null, imageUrl: null, awardCount: 1 }],
        })}
      />,
    );
    expect(markup).toContain("You reached Level 3!");
    expect(markup).toContain("Loop Master");
  });
});
