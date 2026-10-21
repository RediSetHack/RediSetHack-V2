import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetRegions: vi.fn(),
  mockGetZones: vi.fn(),
  mockGetStages: vi.fn(),
}));

export const { mockAuth, mockGetRegions, mockGetZones, mockGetStages } = mocks;

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

export const region = {
  id: 1,
  name: "Cyber Basics",
  slug: "cyber-basics",
  description: "Start here.",
  sortOrder: 1,
  storyIntro: null,
};

export const zone = {
  id: 1,
  regionId: 1,
  name: "Networking 101",
  slug: "networking-101",
  description: "Packets and protocols.",
  sortOrder: 1,
};

export function makeStage(
  id: number,
  status: "locked" | "available" | "completed",
  zoneId: number,
) {
  return {
    id,
    zoneId,
    title: `Stage ${id}`,
    slug: `stage-${id}`,
    xpReward: 50,
    sortOrder: id,
    status,
    lockReason: status === "locked" ? "Complete the previous Stage first." : null,
  };
}

export function setupMapCatalog({
  regions = [region],
  zones = [zone],
  stages = [],
}: {
  regions?: unknown[];
  zones?: unknown[];
  stages?: unknown[];
} = {}) {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ getToken: vi.fn().mockResolvedValue("token") });
  mockGetRegions.mockResolvedValue(regions);
  mockGetZones.mockResolvedValue(zones);
  mockGetStages.mockResolvedValue(stages);
}
