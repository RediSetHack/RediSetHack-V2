import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import {
  makeStage,
  mockGetRegions,
  mockGetStages,
  mockGetZones,
  region,
  setupMapCatalog,
  zone,
} from "../map-test-fixtures";

import RegionZonesPage from "./page";

const novelRegion = {
  ...region,
  id: 2,
  name: "Shadow Protocol",
  slug: "shadow-protocol",
  storyIntro: "The network hums with secrets.",
};

const chapter = {
  ...zone,
  id: 2,
  regionId: 2,
  name: "First Contact",
  slug: "first-contact",
  sortOrder: 1,
};

const params = { params: Promise.resolve({ regionId: "1" }) };
const novelParams = { params: Promise.resolve({ regionId: "2" }) };

describe("region zones page", () => {
  beforeEach(() => {
    setupMapCatalog({ regions: [region, novelRegion] });
  });

  it("renders the error-with-retry state when the catalog fails to load", async () => {
    mockGetRegions.mockRejectedValue(new Error("boom"));
    const markup = renderToStaticMarkup(await RegionZonesPage(params));
    expect(markup).toContain("Catalog could not be loaded. Please try again.");
    expect(markup).toContain("Try again");
  });

  it("renders the empty state when the Region has no Zones", async () => {
    mockGetZones.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await RegionZonesPage(params));
    expect(markup).toContain("No Zones in this Region.");
  });

  it("uses a positive progress maximum for a Zone with no Stages", async () => {
    mockGetZones.mockResolvedValue([zone]);
    const markup = renderToStaticMarkup(await RegionZonesPage(params));
    expect(markup).toContain('max="1"');
    expect(markup).toContain("0 Stages · 0 / 0 completed");
  });

  it("shows STORY.EXE and a 0 / 0 summary for an empty Novel chapter", async () => {
    mockGetZones.mockResolvedValue([chapter]);
    const markup = renderToStaticMarkup(await RegionZonesPage(novelParams));
    expect(markup).toContain("STORY.EXE");
    expect(markup).toContain("The network hums with secrets.");
    expect(markup).toContain("Chapter 1: First Contact");
    expect(markup).toContain("0 / 0");
    expect(markup).toContain('max="1"');
  });

  it("shows chapter progress, counts and a resume link for a Novel chapter with Stages", async () => {
    mockGetZones.mockResolvedValue([chapter]);
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed", 2),
      makeStage(2, "available", 2),
    ]);
    const markup = renderToStaticMarkup(await RegionZonesPage(novelParams));
    expect(markup).toContain("1 / 2");
    expect(markup).toContain('max="2"');
    expect(markup).toContain('href="/map/2/2/2"');
    expect(markup).toContain("RESUME: First Contact — Stage 2");
  });

  it("renders the empty state inside the Novel Chapters section when there are no chapters", async () => {
    mockGetZones.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await RegionZonesPage(novelParams));
    expect(markup).toContain("The network hums with secrets.");
    expect(markup).toContain("No Zones in this Region.");
  });
});
