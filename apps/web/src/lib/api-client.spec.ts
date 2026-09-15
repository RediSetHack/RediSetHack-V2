import { describe, expect, it, vi } from "vitest";
import {
  getCharacters,
  selectUserCharacter,
  syncUser,
  getCurrentUser,
  getProfile,
  getTodayEvent,
  getRegions,
  getZones,
  getStages,
  getQuests,
  getLeaderboard,
  ApiError,
} from "./api-client.js";

describe("api-client", () => {
  describe("getCharacters", () => {
    it("fetches the public character catalog with no auth header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, name: "Binary Knight", slug: "binary-knight", description: null, imageUrl: null },
        ],
      });

      const result = await getCharacters(
        "http://localhost:3001/",
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/v1/api/characters",
      );
      expect(result).toEqual([
        { id: 1, name: "Binary Knight", slug: "binary-knight", description: null, imageUrl: null },
      ]);
    });

    it("throws ApiError when the catalog cannot be loaded", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      await expect(
        getCharacters("http://localhost:3001", mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  it("throws ApiError 401 when token is missing", async () => {
    await expect(
      selectUserCharacter("http://localhost:3001", "", 1),
    ).rejects.toThrowError(ApiError);
  });

  it("sends PATCH request with Bearer authorization token and payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        characterId: 2,
        totalXp: 150,
      }),
    });

    const result = await selectUserCharacter(
      "http://localhost:3001/",
      "test-token",
      2,
      mockFetch as unknown as typeof fetch,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/v1/api/user/character",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ characterId: 2 }),
      },
    );
    expect(result.characterId).toBe(2);
    expect(result.id).toBe("user_123");
  });

  it("handles non-200 API error responses correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        message: "Character with id 999 does not exist",
      }),
    });

    await expect(
      selectUserCharacter(
        "http://localhost:3001",
        "test-token",
        999,
        mockFetch as unknown as typeof fetch,
      ),
    ).rejects.toMatchObject({
      status: 404,
      message: "Character with id 999 does not exist",
    });
  });

  it("handles 403 Forbidden responses correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        message: "Admin privileges required",
      }),
    });

    await expect(
      selectUserCharacter(
        "http://localhost:3001",
        "test-token",
        1,
        mockFetch as unknown as typeof fetch,
      ),
    ).rejects.toMatchObject({
      status: 403,
      message: "Admin privileges required",
    });
  });

  describe("syncUser", () => {
    it("throws ApiError 401 when token is missing", async () => {
      await expect(syncUser("http://localhost:3001", "")).rejects.toThrowError(ApiError);
    });

    it("sends POST request to /v1/api/user/sync and returns user data", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "user_123",
          email: "test@example.com",
          name: "Test User",
          characterId: null,
          totalXp: 0,
        }),
      });

      const result = await syncUser(
        "http://localhost:3001",
        "test-token",
        { email: "test@example.com", name: "Test User" },
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/user/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ email: "test@example.com", name: "Test User" }),
      });
      expect(result.id).toBe("user_123");
    });
  });

  describe("getCurrentUser", () => {
    it("throws ApiError 401 when token is missing", async () => {
      await expect(getCurrentUser("http://localhost:3001", "")).rejects.toThrowError(ApiError);
    });

    it("returns null when API returns 404 (user not found in database)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          message: "No account associated with this email, please sign up",
        }),
      });

      const result = await getCurrentUser("http://localhost:3001", "test-token", mockFetch as unknown as typeof fetch);

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/user/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      expect(result).toBeNull();
    });

    it("returns user data when API returns 200", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "user_123",
          email: "test@example.com",
          name: "Test User",
          characterId: 1,
          totalXp: 50,
        }),
      });

      const result = await getCurrentUser("http://localhost:3001", "test-token", mockFetch as unknown as typeof fetch);

      expect(result).toEqual({
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
        characterId: 1,
        totalXp: 50,
      });
    });
  });

  describe("getProfile", () => {
    it("throws ApiError 401 when token is missing", async () => {
      await expect(getProfile("http://localhost:3001", "")).rejects.toThrowError(ApiError);
    });

    it("sends Bearer authorization token and returns the profile", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          userId: "user_123",
          character: { id: 1, name: "Binary Knight", slug: "binary-knight", imageUrl: null },
          totalXp: 450,
          level: 3,
          badges: [],
        }),
      });

      const result = await getProfile(
        "http://localhost:3001/",
        "test-token",
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/users/profile", {
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      expect(result.level).toBe(3);
      expect(result.character?.name).toBe("Binary Knight");
    });

    it("throws ApiError on a non-200 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: "user not found" }),
      });

      await expect(
        getProfile("http://localhost:3001", "test-token", mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("getTodayEvent", () => {
    it("fetches today's event with no auth header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 1,
          eventDate: "2026-09-14",
          eventType: "bonus",
          xpMultiplier: 2,
        }),
      });

      const result = await getTodayEvent(
        "http://localhost:3001/",
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/events/today");
      expect(result.eventType).toBe("bonus");
    });

    it("throws ApiError when the event cannot be loaded", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      await expect(
        getTodayEvent("http://localhost:3001", mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("getRegions", () => {
    it("fetches the Region catalog with no auth header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, name: "Foundations", slug: "foundations", description: null, sortOrder: 1 },
        ],
      });

      const result = await getRegions(
        "http://localhost:3001/",
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/regions");
      expect(result).toHaveLength(1);
    });

    it("throws ApiError when Regions cannot be loaded", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      await expect(
        getRegions("http://localhost:3001", mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("getZones", () => {
    it("fetches a Region's Zones with no auth header", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, regionId: 1, name: "Loops", slug: "loops", description: null, sortOrder: 1 },
        ],
      });

      const result = await getZones(
        "http://localhost:3001/",
        1,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/regions/1/zones");
      expect(result).toHaveLength(1);
    });

    it("throws ApiError when Zones cannot be loaded", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      await expect(
        getZones("http://localhost:3001", 1, mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("getStages", () => {
    it("throws ApiError 401 when token is missing", async () => {
      await expect(getStages("http://localhost:3001", "", 1)).rejects.toThrowError(ApiError);
    });

    it("sends Bearer authorization token and returns a Zone's Stages", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 1,
            zoneId: 1,
            title: "For loops",
            slug: "for-loops",
            lessonContent: [],
            xpReward: 50,
            sortOrder: 1,
            status: "available",
          },
        ],
      });

      const result = await getStages(
        "http://localhost:3001/",
        "test-token",
        1,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/zones/1/stages", {
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      expect(result[0]?.status).toBe("available");
    });

    it("throws ApiError on a non-200 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: "locked" }),
      });

      await expect(
        getStages("http://localhost:3001", "test-token", 1, mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe("getQuests", () => {
    it("throws ApiError 401 when token is missing", async () => {
      await expect(getQuests("http://localhost:3001", "")).rejects.toThrowError(ApiError);
    });

    it("sends Bearer authorization token and returns the Quest listing", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 1,
            stageId: 10,
            title: "Loop fundamentals",
            description: null,
            timeLimitSeconds: 300,
            passingScore: 70,
            xpReward: 100,
            completed: false,
          },
        ],
      });

      const result = await getQuests(
        "http://localhost:3001/",
        "test-token",
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3001/v1/api/quests", {
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      expect(result[0]?.completed).toBe(false);
    });

    it("throws ApiError on a non-200 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "boom" }),
      });

      await expect(
        getQuests("http://localhost:3001", "test-token", mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 500 });
    });
  });

  describe("getLeaderboard", () => {
    it("throws ApiError 401 when token is missing", async () => {
      await expect(getLeaderboard("http://localhost:3001", "", 1, 20)).rejects.toThrowError(
        ApiError,
      );
    });

    it("sends Bearer authorization token with page and limit query params", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          page: 2,
          limit: 10,
          total: 25,
          entries: [{ rank: 11, userId: "user_1", name: "Ada", totalXp: 900, level: 4 }],
        }),
      });

      const result = await getLeaderboard(
        "http://localhost:3001/",
        "test-token",
        2,
        10,
        mockFetch as unknown as typeof fetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/v1/api/leaderboard?page=2&limit=10",
        { headers: { Authorization: "Bearer test-token" } },
      );
      expect(result.page).toBe(2);
      expect(result.entries[0]?.userId).toBe("user_1");
    });

    it("throws ApiError on a non-200 response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: "boom" }),
      });

      await expect(
        getLeaderboard("http://localhost:3001", "test-token", 1, 20, mockFetch as unknown as typeof fetch),
      ).rejects.toMatchObject({ status: 500 });
    });
  });
});
