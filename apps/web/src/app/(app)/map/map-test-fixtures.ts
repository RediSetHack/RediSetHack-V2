import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetRegions: vi.fn(),
  mockGetZones: vi.fn(),
  mockGetStages: vi.fn(),
  mockGetLesson: vi.fn(),
  mockGetProfile: vi.fn(),
}));

export const {
  mockAuth,
  mockGetRegions,
  mockGetZones,
  mockGetStages,
  mockGetLesson,
  mockGetProfile,
} = mocks;

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: vi.fn() }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("not-found");
  },
}));

/** A status-carrying error matching `@/lib/api-client`'s `ApiError`, so page specs can simulate 403/404. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

vi.mock("@/lib/api-client", () => ({
  getRegions: mockGetRegions,
  getZones: mockGetZones,
  getStages: mockGetStages,
  getLesson: mockGetLesson,
  getProfile: mockGetProfile,
  ApiError,
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

export function makeLesson(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    zoneId: 1,
    title: "Stage 1",
    slug: "stage-1",
    xpReward: 50,
    sortOrder: 1,
    status: "available",
    blocks: [{ type: "text", content: "Loops repeat code." }],
    ...overrides,
  };
}

/** Boots the Stage page: Regions/Zones/Stages for the breadcrumb, a Lesson and a Profile. */
export function setupStagePage({
  lesson = makeLesson(),
  stages = [makeStage(1, "available", 1)],
  totalXp = 150,
}: {
  lesson?: unknown;
  stages?: unknown[];
  totalXp?: number;
} = {}) {
  setupMapCatalog({ stages });
  mockGetLesson.mockResolvedValue(lesson);
  mockGetProfile.mockResolvedValue({ totalXp });
}
