import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CharacterListResponseSchema } from '@repo/contracts';

import { ListCharactersUseCase } from '../../application/list-characters.use-case.js';
import { CharacterPresenter } from '../presenters.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

// Public, unauthenticated: the picker runs during onboarding, before a user
// record exists (issue #55).
@ApiTags('Catalog Browsing')
@Controller('v1/api/characters')
export class ListCharactersController {
  constructor(private readonly listCharacters: ListCharactersUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List every Character in the catalog.' })
  @ApiZodResponse(CharacterListResponseSchema)
  async handle() {
    const characters = await this.listCharacters.execute();
    return characters.map(CharacterPresenter.toResponse);
  }
}
