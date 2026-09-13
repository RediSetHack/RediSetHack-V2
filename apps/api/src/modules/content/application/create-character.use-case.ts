import { Character } from '../../auth/domain/entities/character.entity.js';
import { CharacterRepository } from '../../auth/domain/ports/character.repository.js';

export type CreateCharacterInput = {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
};

export class CreateCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  execute(input: CreateCharacterInput): Promise<Character> {
    return this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
    });
  }
}
