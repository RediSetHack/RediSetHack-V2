import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Window, StatusChip, XPChip, SegmentedTracker, Progress, EmptyState, BadgeTile } from "@/components/y2k";

describe("Window", () => {
  it("renders the title and three control squares", () => {
    const markup = renderToStaticMarkup(<Window title="MAP.EXE">content</Window>);
    expect(markup).toContain("MAP.EXE");
    expect(markup).toContain("content");
  });
});

describe("StatusChip", () => {
  it.each([
    ["locked", "Locked"],
    ["unlocked", "Unlocked"],
    ["completed", "Completed"],
    ["passed", "Passed"],
    ["not-passed", "Not passed"],
    ["not-taken", "Not taken"],
  ] as const)("labels %s in text", (status, label) => {
    const markup = renderToStaticMarkup(<StatusChip status={status} />);
    expect(markup).toContain(label);
  });
});

describe("XPChip", () => {
  it("formats XP", () => {
    expect(renderToStaticMarkup(<XPChip xp={1240} />)).toContain("1,240 XP");
  });
});

describe("Progress", () => {
  it("exposes aria-valuenow and clamps", () => {
    const markup = renderToStaticMarkup(<Progress value={150} max={100} label="Zone progress" />);
    expect(markup).toContain('aria-valuenow="150"');
    expect(markup).toContain('aria-valuemax="100"');
    expect(markup).toContain('width:100%');
  });
});

describe("SegmentedTracker", () => {
  it("marks current step and states in labels", () => {
    const markup = renderToStaticMarkup(
      <SegmentedTracker total={3} current={1} answered={new Set([0])} />,
    );
    expect(markup).toContain('aria-label="Question 1: answered"');
    expect(markup).toContain('aria-label="Question 2: current"');
    expect(markup).toContain('aria-label="Question 3: unanswered"');
    expect(markup).toContain('aria-current="step"');
  });
});

describe("EmptyState", () => {
  it("renders title and message", () => {
    const markup = renderToStaticMarkup(<EmptyState title="No Quests available." message="Check back soon." />);
    expect(markup).toContain("No Quests available.");
    expect(markup).toContain("Check back soon.");
  });
});

describe("BadgeTile", () => {
  it("states earned count in text", () => {
    const markup = renderToStaticMarkup(<BadgeTile name="Quest Master" earnedCount={3} />);
    expect(markup).toContain("Quest Master");
    expect(markup).toContain("Earned ×3");
  });
});
