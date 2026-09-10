import { Injectable } from "@nestjs/common";

import { CharacterRepository } from "../domain/ports/character.repository.js";
import { UserRepository } from "../domain/ports/user.repository.js";
import { User } from "../domain/entities/user.entity.js";
import { CharacterNotFoundError } from "../domain/errors.js";

export type SelectCharacterInput = {
  userId: string;
  characterId: number;
};

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