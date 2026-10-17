import { describe, expect, it, vi } from "vitest";
import type { Database } from "@repo/db";

import { DrizzleUserRepository } from "./infrastructure/drizzle-user.repository.js";
import { InvalidUserEmailError } from "./domain/errors.js";

function transactionalDb(mock: Database): Database {
  const mocked = mock as unknown as { query: Record<string, unknown> };
  const tx = {
    ...mocked,
    execute: vi.fn().mockResolvedValue(undefined),
    query: {
      ...mocked.query,
      deletedUsers: { findFirst: vi.fn().mockResolvedValue(null) },
    },
  };
  return {
    ...mocked,
    transaction: vi.fn((callback: (transaction: object) => unknown) => callback(tx)),
  } as unknown as Database;
}

describe("DrizzleUserRepository", () => {
  it("throws InvalidUserEmailError when new user has no email", async () => {
    const mockDb = {
      query: {
        users: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    } as unknown as Database;

    const repo = new DrizzleUserRepository(transactionalDb(mockDb));

    await expect(
      repo.upsert({
        id: "user_new",
        email: null,
        name: "No Email",
        role: "user",
      }),
    ).rejects.toBeInstanceOf(InvalidUserEmailError);
  });

  it("preserves existing email if identity email is null during re-sync", async () => {
    const existingRow = {
      id: "user_existing",
      email: "existing@example.com",
      name: "Existing User",
      characterId: null,
      totalXp: 0,
    };

    const returningMock = vi.fn().mockResolvedValue([
      {
        ...existingRow,
        name: "Updated Name",
      },
    ]);
    const onConflictDoUpdateMock = vi.fn().mockReturnValue({
      returning: returningMock,
    });
    const valuesMock = vi.fn().mockReturnValue({
      onConflictDoUpdate: onConflictDoUpdateMock,
    });
    const insertMock = vi.fn().mockReturnValue({
      values: valuesMock,
    });

    const mockDb = {
      query: {
        users: {
          findFirst: vi.fn().mockResolvedValue(existingRow),
        },
      },
      insert: insertMock,
    } as unknown as Database;

    const repo = new DrizzleUserRepository(transactionalDb(mockDb));

    const result = await repo.upsert({
      id: "user_existing",
      email: null,
      name: "Updated Name",
      role: "user",
    });

    expect(result.email).toBe("existing@example.com");
    expect(result.name).toBe("Updated Name");
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_existing",
        email: "existing@example.com",
        name: "Updated Name",
      }),
    );
  });

  it("upserts user with provided valid email", async () => {
    const returnedRow = {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      characterId: 1,
      totalXp: 10,
    };

    const returningMock = vi.fn().mockResolvedValue([returnedRow]);
    const onConflictDoUpdateMock = vi.fn().mockReturnValue({
      returning: returningMock,
    });
    const valuesMock = vi.fn().mockReturnValue({
      onConflictDoUpdate: onConflictDoUpdateMock,
    });
    const insertMock = vi.fn().mockReturnValue({
      values: valuesMock,
    });

    const mockDb = {
      query: {
        users: {
          findFirst: vi.fn(),
        },
      },
      insert: insertMock,
    } as unknown as Database;

    const repo = new DrizzleUserRepository(transactionalDb(mockDb));

    const result = await repo.upsert({
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      role: "user",
    });

    expect(result.id).toBe("user_123");
    expect(result.email).toBe("test@example.com");
    expect(valuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user_123",
        email: "test@example.com",
        name: "Test User",
      }),
    );
  });
});
