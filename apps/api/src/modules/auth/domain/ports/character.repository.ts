import { Character } from "../entities/character.entity.js";

export abstract class CharacterRepository {
  abstract findById(id: number): Promise<Character | null>;
}