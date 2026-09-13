import { Character } from '../entities/character.entity.js';

export abstract class CharacterRepository {
  abstract findById(id: number): Promise<Character | null>;
  abstract create(input: {
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
  }): Promise<Character>;
  abstract update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      imageUrl: string | null;
    }>,
  ): Promise<Character | null>;
  abstract delete(id: number): Promise<boolean>;
}
