import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CHARACTERS,
  selectUserCharacter,
  syncUser,
  getCurrentUser,
  ApiError,
} from "./api-client.js";

describe("api-client", () => {
  it("exposes default avatar characters", () => {
    expect(DEFAULT_CHARACTERS.length).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_CHARACTERS.map((c) => c.slug)).toEqual(
      expect.arrayContaining([
        "binary-knight",
        "code-wizard",
        "cyber-rogue",
        "devops-alchemist",
        "script-samurai",
      ]),
    );
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
});
