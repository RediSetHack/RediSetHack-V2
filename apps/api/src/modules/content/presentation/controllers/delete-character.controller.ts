import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DeleteCharacterUseCase } from '../../application/delete-character.use-case.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/characters')
export class DeleteCharacterController {
  constructor(private readonly deleteCharacter: DeleteCharacterUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteCharacter.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
