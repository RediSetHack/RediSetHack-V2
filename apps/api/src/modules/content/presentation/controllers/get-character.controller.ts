import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CharacterSchema } from '@repo/contracts';

import { GetCharacterUseCase } from '../../application/get-character.use-case.js';
import { CharacterPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Characters')
@Controller('v1/api/admin/characters')
export class GetCharacterController {
  constructor(private readonly getCharacter: GetCharacterUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Character by id.' })
  @ApiParam({ name: 'id', description: "The Character's id." })
  @ApiZodResponse(CharacterSchema)
  @ApiEntityNotFound('Character')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return CharacterPresenter.toResponse(await this.getCharacter.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
