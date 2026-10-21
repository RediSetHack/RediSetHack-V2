import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  getRegions: vi.fn(),
  getZones: vi.fn(),
  getStages: vi.fn(),
  getQuests: vi.fn(),
  getBadgeDefinitions: vi.fn(),
  getCharacters: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("token") }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    getRegions: mocks.getRegions,
    getZones: mocks.getZones,
    getStages: mocks.getStages,
    getQuests: mocks.getQuests,
    getBadgeDefinitions: mocks.getBadgeDefinitions,
    getCharacters: mocks.getCharacters,
  };
});

const { fetchCatalog } = await import("./use-catalog");

const region = { id: 1, name: "Linux Basics", slug: "linux-basics", description: null, sortOrder: 0, storyIntro: null };
const zone = { id: 10, regionId: 1, name: "Shell", slug: "shell", description: null, sortOrder: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRegions.mockResolvedValue([region]);
  mocks.getZones.mockResolvedValue([zone]);
  mocks.getStages.mockResolvedValue([]);
  mocks.getQuests.mockResolvedValue([]);
  mocks.getBadgeDefinitions.mockResolvedValue([]);
  mocks.getCharacters.mockResolvedValue([]);
});

describe("fetchCatalog", () => {
  it("loads the listings the caller asked for", async () => {
    const rows = await fetchCatalog("token", { stages: true, quests: true, badges: true, characters: true }, () => false);

    expect(mocks.getRegions).toHaveBeenCalled();
    expect(mocks.getZones).toHaveBeenCalledWith(expect.any(String), 1);
    expect(mocks.getStages).toHaveBeenCalledWith(expect.any(String), "token", 10);
    expect(mocks.getQuests).toHaveBeenCalledWith(expect.any(String), "token");
    expect(mocks.getBadgeDefinitions).toHaveBeenCalled();
    expect(mocks.getCharacters).toHaveBeenCalled();
    expect(rows).toMatchObject({ regions: [region], zones: [zone] });
  });

  it("skips the listings the caller did not ask for", async () => {
    await fetchCatalog("token", {}, () => false);

    expect(mocks.getStages).not.toHaveBeenCalled();
    expect(mocks.getQuests).not.toHaveBeenCalled();
    expect(mocks.getBadgeDefinitions).not.toHaveBeenCalled();
    expect(mocks.getCharacters).not.toHaveBeenCalled();
  });

  it("reports a live failure to the caller", async () => {
    mocks.getRegions.mockRejectedValue(new ApiError(403, "The caller is not an admin."));

    await expect(fetchCatalog("token", {}, () => false)).rejects.toThrow("The caller is not an admin.");
  });

  it("stays silent when the request was canceled", async () => {
    mocks.getRegions.mockRejectedValue(new ApiError(403, "The caller is not an admin."));

    // A canceled load resolves to `null` instead of throwing: the page that
    // replaced it owns the shell state, so a stale 403 must never reach it.
    await expect(fetchCatalog("token", {}, () => true)).resolves.toBeNull();
  });

  it("stays silent when the request was canceled after the first listing", async () => {
    mocks.getZones.mockRejectedValue(new ApiError(403, "The caller is not an admin."));

    await expect(fetchCatalog("token", {}, () => true)).resolves.toBeNull();
  });
});
