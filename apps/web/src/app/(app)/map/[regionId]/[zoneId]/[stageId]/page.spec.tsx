import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// base-ui's Dialog portals render client-side only, so the static-markup specs
// can't observe an alert's body through it. Render the alert's title, body and
// actions inline instead — the same approach stage-completion.spec.tsx uses.
vi.mock("@/components/y2k-dialog", async (importActual) => {
  const actual = await importActual<typeof import("@/components/y2k-dialog")>();
  return {
    ...actual,
    Y2kAlert: ({
      title,
      children,
      actions,
    }: {
      title: string;
      children: ReactNode;
      actions?: ReactNode;
    }) => (
      <div role="alert">
        <span>{title}</span>
        <span>{children}</span>
        {actions}
      </div>
    ),
  };
});

import {
  ApiError,
  makeLesson,
  mockGetLesson,
  setupStagePage,
} from "../../../map-test-fixtures";

import StagePage from "./page";

const params = { params: Promise.resolve({ regionId: "1", zoneId: "1", stageId: "1" }) };

describe("stage lesson page", () => {
  beforeEach(() => {
    setupStagePage();
  });

  it("renders the Stage title window with XP and status chips", async () => {
    const markup = renderToStaticMarkup(await StagePage(params));
    expect(markup).toContain("Stage 1");
    expect(markup).toContain("50 XP");
    expect(markup).toContain("Unlocked");
    expect(markup).toContain('href="/map"');
    expect(markup).toContain("Cyber Basics");
    expect(markup).toContain("Networking 101");
  });

  it("renders text, code, image and exercise blocks each in their own window", async () => {
    mockGetLesson.mockResolvedValue(
      makeLesson({
        blocks: [
          { type: "text", content: "Loops repeat code." },
          { type: "code", language: "javascript", content: "console.log(1)" },
          { type: "image", url: "https://example.com/a.png", alt: "A diagram", caption: "Loops" },
          {
            type: "exercise",
            prompt: "Write a for loop.",
            language: "javascript",
            starterCode: "for (let i = 0; i < 10; i++) {}",
          },
        ],
      }),
    );
    const markup = renderToStaticMarkup(await StagePage(params));
    expect(markup).toContain("Loops repeat code.");
    expect(markup).toContain(">javascript<");
    expect(markup).toContain("COPY");
    expect(markup).toContain("A diagram");
    expect(markup).toContain("Loops");
    expect(markup).toContain("Write a for loop.");
    expect(markup).toContain("STARTER CODE");
    expect(markup).toContain("OPEN IN CODELAB");
    expect(markup).toContain("codelab?language=javascript");
  });

  it("renders an unsupported-block dialog for an unknown block type", async () => {
    mockGetLesson.mockResolvedValue(
      makeLesson({ blocks: [{ type: "video", url: "https://example.com/clip.mp4" }] }),
    );
    const markup = renderToStaticMarkup(await StagePage(params));
    expect(markup).toContain("UNSUPPORTED");
  });

  it("shows the locked Lesson dialog with BACK TO ZONE on a 403", async () => {
    mockGetLesson.mockRejectedValue(new ApiError(403, "locked"));
    const markup = renderToStaticMarkup(await StagePage(params));
    expect(markup).toContain(
      "This Stage is locked — finish the Stage before it to unlock the Lesson.",
    );
    expect(markup).toContain("BACK TO ZONE");
  });

  it("renders the error-with-retry state when the Lesson fails to load", async () => {
    mockGetLesson.mockRejectedValue(new Error("boom"));
    const markup = renderToStaticMarkup(await StagePage(params));
    expect(markup).toContain("The Lesson could not be loaded. Please try again.");
    expect(markup).toContain("Try again");
  });

  it("shows the no-XP notice and a disabled button for a completed Stage", async () => {
    mockGetLesson.mockResolvedValue(makeLesson({ status: "completed" }));
    const markup = renderToStaticMarkup(await StagePage(params));
    expect(markup).toContain("Already completed — reading it again awards no XP.");
    expect(markup).not.toContain("MARK AS COMPLETE");
  });

  it("offers MARK AS COMPLETE for an available Stage", async () => {
    mockGetLesson.mockResolvedValue(makeLesson({ status: "available" }));
    const markup = renderToStaticMarkup(await StagePage(params));
    expect(markup).toContain("MARK AS COMPLETE");
  });
});
