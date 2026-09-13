import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';

import { UpdateCharacterUseCase } from '../../application/update-character.use-case.js';
import { UpdateCharacterRequestDto } from '../dto/update-character.dto.js';
import { CharacterPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/characters')
export class UpdateCharacterController {
  constructor(private readonly updateCharacter: UpdateCharacterUseCase) {}
  @Patch(':id')
  @AdminOnly()
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
