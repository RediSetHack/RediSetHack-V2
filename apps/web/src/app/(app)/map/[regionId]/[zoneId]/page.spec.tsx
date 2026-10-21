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

import ZoneStagesPage from "./page";

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

function makeStage(id: number, status: "locked" | "available" | "completed") {
  return {
    id,
    zoneId: 1,
    title: `Stage ${id}`,
    slug: `stage-${id}`,
    xpReward: 50,
    sortOrder: id,
    status,
    lockReason: status === "locked" ? "Complete the previous Stage first." : null,
  };
}

const params = { params: Promise.resolve({ regionId: "1", zoneId: "1" }) };

describe("zone stages page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ getToken: vi.fn().mockResolvedValue("token") });
    mockGetRegions.mockResolvedValue([region]);
    mockGetZones.mockResolvedValue([zone]);
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed"),
      makeStage(2, "completed"),
    ]);
  });

  it("shows ZONE CLEARED only when every Stage in the Zone is completed", async () => {
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain("ZONE CLEARED");
  });

  it("hides ZONE CLEARED while any Stage is still unlocked", async () => {
    mockGetStages.mockResolvedValue([
      makeStage(1, "completed"),
      makeStage(2, "available"),
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
      makeStage(1, "completed"),
      makeStage(2, "available"),
      makeStage(3, "locked"),
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
      makeStage(1, "completed"),
      makeStage(2, "available"),
      makeStage(3, "locked"),
    ]);
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain('href="/map/1/1/1"');
    expect(markup).toContain('href="/map/1/1/2"');
    expect(markup).not.toContain('href="/map/1/1/3"');
    expect(markup).toContain("Locked — finish the previous Stage first.");
  });

  it("renders clickable MAP and Region breadcrumb segments", async () => {
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain('href="/map"');
    expect(markup).toContain('href="/map/1"');
    expect(markup).toContain("Cyber Basics");
    expect(markup).toContain("Networking 101");
  });

  it("renders the error-with-retry state when Stages fail to load", async () => {
    mockGetStages.mockRejectedValue(new Error("boom"));
    const markup = renderToStaticMarkup(await ZoneStagesPage(params));
    expect(markup).toContain("Stages could not be loaded. Please try again.");
    expect(markup).toContain("Try again");
  });
});
