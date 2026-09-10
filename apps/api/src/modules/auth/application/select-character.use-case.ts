import { Injectable } from "@nestjs/common";

import { CharacterRepository } from "../domain/ports/character.repository.js";
import { UserRepository } from "../domain/ports/user.repository.js";
import { User } from "../domain/entities/user.entity.js";

export type SelectCharacterInput = {
  userId: string;
  characterId: number;
};

export class CharacterNotFoundError extends Error {
  constructor(characterId: number) {
    super(`Character with id ${characterId} does not exist`);
    this.name = "CharacterNotFoundError";
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with id ${userId} does not exist`);
    this.name = "UserNotFoundError";
  }
}

@Injectable()
export class SelectCharacterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly characters: CharacterRepository,
  ) {}

  async execute(input: SelectCharacterInput): Promise<User> {
    const character = await this.characters.findById(input.characterId);
    if (!character) {
      throw new CharacterNotFoundError(input.characterId);
    }
    return this.users.updateCharacter(input.userId, input.characterId);
  }
}