import { describe, expect, it, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

import { User } from "./domain/entities/user.entity.js";
import { ClerkAuthPort } from "./domain/ports/clerk-auth.port.js";
import { GetUserUseCase } from "./application/get-user.use-case.js";
import { UserNotFoundError } from "./domain/errors.js";
import { GetUserMeController } from "./presentation/controllers/get-user-me.controller.js";

describe("GetUserMeController", () => {
  const learner = new User("user_1", "learner@example.com", "Learner", null, 0);

  it("throws UnauthorizedException when request is not authenticated", async () => {
    const clerkAuth: ClerkAuthPort = {
      authenticate: vi.fn().mockResolvedValue(null),
    };
    const getUser = {
      execute: vi.fn(),
    } as unknown as GetUserUseCase;
    const controller = new GetUserMeController(clerkAuth, getUser);

    const req = {} as IncomingMessage;
    await expect(controller.handle(req)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(getUser.execute).not.toHaveBeenCalled();
  });

  it("throws NotFoundException with custom message when user is not found in database", async () => {
    const clerkAuth: ClerkAuthPort = {
      authenticate: vi.fn().mockResolvedValue({
        id: "user_1",
        email: "learner@example.com",
        name: "Learner",
        role: "user",
      }),
    };
    const getUser = {
      execute: vi.fn().mockRejectedValue(new UserNotFoundError("user_1")),
    } as unknown as GetUserUseCase;
    const controller = new GetUserMeController(clerkAuth, getUser);

    const req = {} as IncomingMessage;
    await expect(controller.handle(req)).rejects.toMatchObject({
      message: "No account associated with this email, please sign up",
      status: 404,
    });
  });

  it("returns user response when user is found in database", async () => {
    const clerkAuth: ClerkAuthPort = {
      authenticate: vi.fn().mockResolvedValue({
        id: "user_1",
        email: "learner@example.com",
        name: "Learner",
        role: "user",
      }),
    };
    const getUser = {
      execute: vi.fn().mockResolvedValue(learner),
    } as unknown as GetUserUseCase;
    const controller = new GetUserMeController(clerkAuth, getUser);

    const req = {} as IncomingMessage;
    const result = await controller.handle(req);

    expect(result).toEqual({
      id: "user_1",
      email: "learner@example.com",
      name: "Learner",
      characterId: null,
      totalXp: 0,
    });
  });
});
