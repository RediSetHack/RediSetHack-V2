import { Character } from '../../auth/domain/entities/character.entity.js';
import { CharacterRepository } from '../../auth/domain/ports/character.repository.js';
import { CharacterNotFoundError } from '../domain/errors.js';

export class GetCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  async execute(id: number): Promise<Character> {
    const character = await this.repository.findById(id);
    if (!character) throw new CharacterNotFoundError(id);
    return character;
  }
}
