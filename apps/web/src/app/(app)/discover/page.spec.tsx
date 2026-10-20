import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockGetDiscover } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetDiscover: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@/lib/api-client", () => ({ getDiscover: mockGetDiscover }));

import { COMPETENCIES } from "@repo/contracts";
import DiscoverPage from "./page";

describe("discover page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ getToken: vi.fn().mockResolvedValue("token") });
    mockGetDiscover.mockResolvedValue([]);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("offers the complete competency taxonomy even when results are capped", async () => {
    // Only a single stage is returned, tagged with a single competency. The
    // selector must still expose every supported competency, not just those
    // present in the capped result set.
    mockGetDiscover.mockResolvedValue([
      {
        kind: "stage",
        id: 1,
        title: "For loops",
        slug: "for-loops",
        description: null,
        regionId: 1,
        regionName: "Foundations",
        zoneId: 1,
        zoneName: "Loops",
        competencies: [{ id: "programming.control-flow", title: "Control flow", objective: "Use conditions and loops." }],
        difficulty: "beginner",
        xpReward: 50,
        sortOrder: 1,
        status: "available",
        lockReason: null,
      },
    ]);

    const markup = renderToStaticMarkup(await DiscoverPage({ searchParams: Promise.resolve({}) }));
    for (const competency of COMPETENCIES) {
      expect(markup).toContain(`value="${competency.id}"`);
    }
  });

  it("forwards filters from asynchronous Next search parameters", async () => {
    await DiscoverPage({ searchParams: Promise.resolve({ q: "python", competency: "programming.control-flow", difficulty: "beginner" }) });
    expect(mockGetDiscover).toHaveBeenCalledWith(expect.any(String), "token", expect.objectContaining({
      q: "python", competency: "programming.control-flow", difficulty: "beginner",
    }));
  });

  it("designates a Region as a Novel only when storyIntro is non-null", async () => {
    mockGetDiscover.mockResolvedValue([
      {
        kind: "region",
        id: 1,
        title: "Novel Region",
        slug: "novel-region",
        description: null,
        storyIntro: "Once upon a time",
        sortOrder: 1,
      },
      {
        kind: "region",
        id: 2,
        title: "Plain Region",
        slug: "plain-region",
        description: null,
        storyIntro: null,
        sortOrder: 2,
      },
    ]);

    const markup = renderToStaticMarkup(await DiscoverPage({ searchParams: Promise.resolve({}) }));
    // Novel section contains the story-intro region.
    expect(markup).toContain("Novel");
    // Plain region (null storyIntro) is listed under Regions, not Novels.
    expect(markup).toContain("Plain Region");
  });
});