import { Injectable } from '@nestjs/common';

import { Character } from '../../auth/domain/entities/character.entity.js';
import { CharacterRepository } from '../../auth/domain/ports/character.repository.js';

@Injectable()
export class ListCharactersUseCase {
  constructor(private readonly characters: CharacterRepository) {}

  async execute(): Promise<Character[]> {
    return this.characters.findAll();
  }
}
