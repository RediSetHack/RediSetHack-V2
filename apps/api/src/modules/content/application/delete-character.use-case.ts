import { CharacterRepository } from '../../auth/domain/ports/character.repository.js';
import { CharacterNotFoundError } from '../domain/errors.js';

export class DeleteCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new CharacterNotFoundError(id);
  }
}
