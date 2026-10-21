import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { makeStage, mockGetStages, setupMapCatalog } from "../../map-test-fixtures";

import ZoneStagesPage from "./page";

const params = { params: Promise.resolve({ regionId: "1", zoneId: "1" }) };

describe("zone stages page", () => {
  beforeEach(() => {
    setupMapCatalog({
      stages: [makeStage(1, "completed", 1), makeStage(2, "completed", 1)],
    });
  });

  it("shows ZONE CLEARED only when every Stage in the Zone is completed", async () => {
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain("ZONE CLEARED");
  });

  it("hides ZONE CLEARED while any Stage is still unlocked", async () => {
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed", 1),
      makeStage(2, "available", 1),
    ]);
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).not.toContain("ZONE CLEARED");
  });

  it("hides ZONE CLEARED for an empty Zone", async () => {
    mockGetStages.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).not.toContain("ZONE CLEARED");
    expect(markup).toContain("This Zone has no Stages yet.");
  });

  it("renders numbered Stage nodes with XP and status chips plus the rules callout", async () => {
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed", 1),
      makeStage(2, "available", 1),
      makeStage(3, "locked", 1),
    ]);
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain("Stage 1");
    expect(markup).toContain("50 XP");
    expect(markup).toContain("Completed");
    expect(markup).toContain("Unlocked");
    expect(markup).toContain("Locked");
    expect(markup).toContain("Finish a Stage to unlock the next one.");
  });

  it("does not link locked Stages and exposes the lock reason accessibly", async () => {
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed", 1),
      makeStage(2, "available", 1),
      makeStage(3, "locked", 1),
    ]);
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain('href="/map/1/1/1"');
    expect(markup).toContain('href="/map/1/1/2"');
    expect(markup).not.toContain('href="/map/1/1/3"');
    expect(markup).toMatch(/<span[^>]*>Locked — finish the previous Stage first\.<\/span>/);
  });

  it("renders clickable MAP and Region breadcrumb segments", async () => {
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain('href="/map"');
    expect(markup).toContain('href="/map/1"');
    expect(markup).toContain("Cyber Basics");
    expect(markup).toContain("Networking 101");
  });

  it("renders the error-with-retry state and keeps breadcrumb links when Stages fail to load", async () => {
    mockGetStages.mockRejectedValue(new Error("boom"));
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain("Stages could not be loaded. Please try again.");
    expect(markup).toContain("Try again");
    expect(markup).toContain('href="/map"');
    expect(markup).toContain('href="/map/1"');
  });

  it("keeps the Region breadcrumb link when the Zone has no Stages", async () => {
    mockGetStages.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain('href="/map/1"');
    expect(markup).toContain("This Zone has no Stages yet.");
  });
});
