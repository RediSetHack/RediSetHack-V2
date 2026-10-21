import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockGetRegions, mockGetZones, mockGetStages } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetRegions: vi.fn(),
  mockGetZones: vi.fn(),
  mockGetStages: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("not-found");
  },
}));
vi.mock("@/lib/api-client", () => ({
  getRegions: mockGetRegions,
  getZones: mockGetZones,
  getStages: mockGetStages,
}));

import RegionZonesPage from "./page";

const region = {
  id: 1,
  name: "Cyber Basics",
  slug: "cyber-basics",
  description: "Start here.",
  sortOrder: 1,
  storyIntro: null,
};

const novelRegion = {
  ...region,
  id: 2,
  name: "Shadow Protocol",
  slug: "shadow-protocol",
  storyIntro: "The network hums with secrets.",
};

const zone = {
  id: 1,
  regionId: 1,
  name: "Networking 101",
  slug: "networking-101",
  description: "Packets and protocols.",
  sortOrder: 1,
};

const chapter = {
  ...zone,
  id: 2,
  regionId: 2,
  name: "First Contact",
  slug: "first-contact",
  sortOrder: 1,
};

function makeStage(id: number, status: "locked" | "available" | "completed") {
  return {
    id,
    zoneId: 2,
    title: `Stage ${id}`,
    slug: `stage-${id}`,
    xpReward: 50,
    sortOrder: id,
    status,
    lockReason: status === "locked" ? "Complete the previous Stage first." : null,
  };
}

const params = { params: Promise.resolve({ regionId: "1" }) };
const novelParams = { params: Promise.resolve({ regionId: "2" }) };

describe("region zones page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ getToken: vi.fn().mockResolvedValue("token") });
    mockGetRegions.mockResolvedValue([region, novelRegion]);
    mockGetZones.mockResolvedValue([zone]);
    mockGetStages.mockResolvedValue([]);
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
    expect(markup).toContain("The network hums with secrets.");
    expect(markup).toContain("Chapter 1: First Contact");
    expect(markup).toContain("0 / 0");
    expect(markup).toContain('max="1"');
  });

  it("shows chapter progress and counts for a Novel chapter with Stages", async () => {
    mockGetZones.mockResolvedValue([chapter]);
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed"),
      makeStage(2, "available"),
    ]);
    const markup = renderToStaticMarkup(await RegionZonesPage(novelParams));
    expect(markup).toContain("1 / 2");
    expect(markup).toContain('max="2"');
  });

  it("renders the empty state inside the Novel Chapters section when there are no chapters", async () => {
    mockGetZones.mockResolvedValue([]);
    const markup = renderToStaticMarkup(await RegionZonesPage(novelParams));
    expect(markup).toContain("The network hums with secrets.");
    expect(markup).toContain("No Zones in this Region.");
  });
});
