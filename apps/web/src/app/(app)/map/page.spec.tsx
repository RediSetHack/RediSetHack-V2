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

import MapPage from "./page";

const region = {
  id: 1,
  name: "Cyber Basics",
  slug: "cyber-basics",
  description: "Start here.",
  sortOrder: 1,
  storyIntro: null,
};

const zone = {
  id: 1,
  regionId: 1,
  name: "Networking 101",
  slug: "networking-101",
  description: "Packets and protocols.",
  sortOrder: 1,
};

describe("map regions page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ getToken: vi.fn().mockResolvedValue("token") });
    mockGetRegions.mockResolvedValue([region]);
    mockGetZones.mockResolvedValue([zone]);
    mockGetStages.mockResolvedValue([]);
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
      { id: 1, zoneId: 1, status: "completed" },
      { id: 2, zoneId: 1, status: "available" },
    ]);
    const markup = renderToStaticMarkup(await MapPage());
    expect(markup).toContain("Cyber Basics");
    expect(markup).toContain("1 Zone");
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
