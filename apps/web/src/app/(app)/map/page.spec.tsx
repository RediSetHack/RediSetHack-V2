import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { makeStage, mockGetRegions, mockGetStages, setupMapCatalog } from "./map-test-fixtures";

import MapPage from "./page";

describe("map regions page", () => {
  beforeEach(() => {
    setupMapCatalog();
  });

  it("renders the error-with-retry state when Regions fail to load", async () => {
    mockGetRegions.mockRejectedValue(new Error("boom"));
    const markup = renderToStaticMarkup(await MapPage());
    expect(markup).toContain("Regions could not be loaded. Please try again.");
    expect(markup).toContain("Try again");
  });

  it("renders the empty state when there are no Regions", async () => {
    mockGetRegions.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await MapPage());
    expect(markup).toContain("No Regions yet.");
  });

  it("renders Region cards with zone counts and progress", async () => {
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed", 1),
      makeStage(2, "available", 1),
    ]);
    const markup = renderToStaticMarkup(await MapPage());
    expect(markup).toContain("Cyber Basics");
    expect(markup).toContain("1 Zone");
    expect(markup).toContain("50% complete");
    expect(markup).toContain('href="/map/1"');
  });

  it("uses a positive progress maximum for a Region with no Stages", async () => {
    mockGetStages.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await MapPage());
    expect(markup).toContain('max="1"');
    expect(markup).toContain('aria-valuemax="1"');
    expect(markup).toContain("0% complete");
  });
});
