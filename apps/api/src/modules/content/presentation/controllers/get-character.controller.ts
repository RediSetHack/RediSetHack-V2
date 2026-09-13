import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { GetCharacterUseCase } from '../../application/get-character.use-case.js';
import { CharacterPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/characters')
export class GetCharacterController {
  constructor(private readonly getCharacter: GetCharacterUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return CharacterPresenter.toResponse(await this.getCharacter.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
