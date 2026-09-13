import { Character } from '../../auth/domain/entities/character.entity.js';
import { CharacterRepository } from '../../auth/domain/ports/character.repository.js';
import { CharacterNotFoundError } from '../domain/errors.js';
import type { CreateCharacterInput } from './create-character.use-case.js';

export type UpdateCharacterInput = Partial<CreateCharacterInput>;

export class UpdateCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  async execute(id: number, input: UpdateCharacterInput): Promise<Character> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new CharacterNotFoundError(id);
    return updated;
  }
}
