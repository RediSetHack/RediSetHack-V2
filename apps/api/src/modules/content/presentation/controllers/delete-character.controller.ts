import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { DeleteCharacterUseCase } from '../../application/delete-character.use-case.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Characters')
@Controller('v1/api/admin/characters')
export class DeleteCharacterController {
  constructor(private readonly deleteCharacter: DeleteCharacterUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Character.' })
  @ApiParam({ name: 'id', description: "The Character's id." })
  @ApiEntityNotFound('Character')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteCharacter.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
