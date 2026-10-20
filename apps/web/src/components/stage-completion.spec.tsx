import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/y2k-dialog", () => ({
  Y2kDialog: ({ actions }: { actions: ReactNode }) => <div>{actions}</div>,
}));

import { StageCompletion } from "./stage-completion";

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
});
