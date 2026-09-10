import { describe, expect, it, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

import { User } from "./domain/entities/user.entity.js";
import { ClerkAuthPort } from "./domain/ports/clerk-auth.port.js";
import { EnsureUserUseCase } from "./application/ensure-user.use-case.js";
import { SyncUserController } from "./presentation/controllers/sync-user.controller.js";

describe("SyncUserController", () => {
  const learner = new User("user_1", "learner@example.com", "Learner", null, 0);

  it("throws UnauthorizedException when request is not authenticated", async () => {
    const clerkAuth: ClerkAuthPort = {
      authenticate: vi.fn().mockResolvedValue(null),
    };
    const ensureUser = {
      execute: vi.fn(),
    } as unknown as EnsureUserUseCase;
    const controller = new SyncUserController(clerkAuth, ensureUser);

    const req = {} as IncomingMessage;
    await expect(controller.handle(req)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(ensureUser.execute).not.toHaveBeenCalled();
  });

  it("ensures user and returns user response on valid authentication", async () => {
    const session = {
      id: "user_1",
      email: "learner@example.com",
      name: "Learner",
      role: "user" as const,
    };
    const clerkAuth: ClerkAuthPort = {
      authenticate: vi.fn().mockResolvedValue(session),
    };
    const ensureUser = {
      execute: vi.fn().mockResolvedValue(learner),
    } as unknown as EnsureUserUseCase;
    const controller = new SyncUserController(clerkAuth, ensureUser);

    const req = {} as IncomingMessage;
    const result = await controller.handle(req);

    expect(ensureUser.execute).toHaveBeenCalledWith(session);
    expect(result).toEqual({
      id: "user_1",
      email: "learner@example.com",
      name: "Learner",
      characterId: null,
      totalXp: 0,
    });
  });

  it("uses email and name provided in the request body when present", async () => {
    const session = {
      id: "user_1",
      email: null,
      name: null,
      role: "user" as const,
    };
    const clerkAuth: ClerkAuthPort = {
      authenticate: vi.fn().mockResolvedValue(session),
    };
    const ensureUser = {
      execute: vi.fn().mockResolvedValue(learner),
    } as unknown as EnsureUserUseCase;
    const controller = new SyncUserController(clerkAuth, ensureUser);

    const req = {} as IncomingMessage;
    await controller.handle(req, {
      email: "learner@example.com",
      name: "Learner",
    });

    expect(ensureUser.execute).toHaveBeenCalledWith({
      id: "user_1",
      email: "learner@example.com",
      name: "Learner",
      role: "user",
    });
  });
});
