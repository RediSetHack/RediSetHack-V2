import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CharacterSchema } from '@repo/contracts';

import { CreateCharacterUseCase } from '../../application/create-character.use-case.js';
import { CreateCharacterRequestDto } from '../dto/create-character.dto.js';
import { CharacterPresenter } from '../presenters.js';
import { AdminOnly } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Characters')
@Controller('v1/api/admin/characters')
export class CreateCharacterController {
  constructor(private readonly createCharacter: CreateCharacterUseCase) {}
  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a Character.' })
  @ApiZodResponse(CharacterSchema, { status: 201 })
  async handle(@Body() dto: CreateCharacterRequestDto) {
    return CharacterPresenter.toResponse(
      await this.createCharacter.execute(dto),
    );
  }
}
