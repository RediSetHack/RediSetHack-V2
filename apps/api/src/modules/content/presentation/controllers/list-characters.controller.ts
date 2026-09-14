import { Controller, Get } from '@nestjs/common';

import { ListCharactersUseCase } from '../../application/list-characters.use-case.js';
import { CharacterPresenter } from '../presenters.js';

// Public, unauthenticated: the picker runs during onboarding, before a user
// record exists (issue #55).
@Controller('v1/api/characters')
export class ListCharactersController {
  constructor(private readonly listCharacters: ListCharactersUseCase) {}

  @Get()
  async handle() {
    const characters = await this.listCharacters.execute();
    return characters.map(CharacterPresenter.toResponse);
  }
}
