import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CharacterSchema } from '@repo/contracts';

import { UpdateCharacterUseCase } from '../../application/update-character.use-case.js';
import { UpdateCharacterRequestDto } from '../dto/update-character.dto.js';
import { CharacterPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Characters')
@Controller('v1/api/admin/characters')
export class UpdateCharacterController {
  constructor(private readonly updateCharacter: UpdateCharacterUseCase) {}
  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update a Character.' })
  @ApiIdParam('Character')
  @ApiZodResponse(CharacterSchema)
  @ApiEntityNotFound('Character')
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCharacterRequestDto,
  ) {
    try {
      return CharacterPresenter.toResponse(
        await this.updateCharacter.execute(id, dto),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}
