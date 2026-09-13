import { Body, Controller, Post } from '@nestjs/common';

import { CreateCharacterUseCase } from '../../application/create-character.use-case.js';
import { CreateCharacterRequestDto } from '../dto/create-character.dto.js';
import { CharacterPresenter } from '../presenters.js';
import { AdminOnly } from './admin-crud.shared.js';

@Controller('v1/api/admin/characters')
export class CreateCharacterController {
  constructor(private readonly createCharacter: CreateCharacterUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateCharacterRequestDto) {
    return CharacterPresenter.toResponse(
      await this.createCharacter.execute(dto),
    );
  }
}
