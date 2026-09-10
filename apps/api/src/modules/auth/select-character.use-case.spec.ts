import { describe, expect, it, vi } from "vitest";

import { Character } from "./domain/entities/character.entity.js";
import { User } from "./domain/entities/user.entity.js";
import { CharacterRepository } from "./domain/ports/character.repository.js";
import { UserRepository } from "./domain/ports/user.repository.js";
import { CharacterNotFoundError, UserNotFoundError } from "./domain/errors.js";
import { SelectCharacterUseCase } from "./application/select-character.use-case.js";

const learner = new User("user_1", "learner@example.com", "Learner", null, 0);

describe("SelectCharacterUseCase", () => {
  it("updates the character of an authenticated user", async () => {
    const users: UserRepository = {
      upsert: vi.fn(),
      findById: vi.fn(),
      updateCharacter: vi.fn().mockResolvedValue(
        new User(learner.id, learner.email, learner.name, 1, learner.totalXp),
      ),
    };
    const characters: CharacterRepository = {
      findById: vi.fn().mockResolvedValue(new Character(1, "Knight", "knight", null, null)),
    };
    const useCase = new SelectCharacterUseCase(users, characters);

    const result = await useCase.execute({ userId: learner.id, characterId: 1 });

    expect(characters.findById).toHaveBeenCalledWith(1);
    expect(users.updateCharacter).toHaveBeenCalledWith(learner.id, 1);
    expect(result.characterId).toBe(1);
  });

  it("throws CharacterNotFoundError when the character does not exist", async () => {
    const users: UserRepository = {
      upsert: vi.fn(),
      findById: vi.fn(),
      updateCharacter: vi.fn(),
    };
    const characters: CharacterRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };
    const useCase = new SelectCharacterUseCase(users, characters);

    await expect(useCase.execute({ userId: learner.id, characterId: 999 })).rejects.toBeInstanceOf(
      CharacterNotFoundError,
    );
    expect(users.updateCharacter).not.toHaveBeenCalled();
  });

  it("propagates UserNotFoundError when the user is unknown", async () => {
    const users: UserRepository = {
      upsert: vi.fn(),
      findById: vi.fn(),
      updateCharacter: vi.fn().mockRejectedValue(new UserNotFoundError("missing")),
    };
    const characters: CharacterRepository = {
      findById: vi.fn().mockResolvedValue(new Character(1, "Knight", "knight", null, null)),
    };
    const useCase = new SelectCharacterUseCase(users, characters);

    await expect(useCase.execute({ userId: "missing", characterId: 1 })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});