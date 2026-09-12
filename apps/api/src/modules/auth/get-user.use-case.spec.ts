import { describe, expect, it, vi } from "vitest";

import { User } from "./domain/entities/user.entity.js";
import { UserRepository } from "./domain/ports/user.repository.js";
import { UserNotFoundError } from "./domain/errors.js";
import { GetUserUseCase } from "./application/get-user.use-case.js";

const learner = new User("user_1", "learner@example.com", "Learner", null, 0);

describe("GetUserUseCase", () => {
  it("returns user when user exists", async () => {
    const users: UserRepository = {
      upsert: vi.fn(),
      findById: vi.fn().mockResolvedValue(learner),
      findByEmail: vi.fn(),
      updateCharacter: vi.fn(),
    };
    const useCase = new GetUserUseCase(users);

    const result = await useCase.execute(learner.id);

    expect(users.findById).toHaveBeenCalledWith(learner.id);
    expect(result).toEqual(learner);
  });

  it("throws UserNotFoundError when user does not exist", async () => {
    const users: UserRepository = {
      upsert: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn(),
      updateCharacter: vi.fn(),
    };
    const useCase = new GetUserUseCase(users);

    await expect(useCase.execute("missing_user")).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
