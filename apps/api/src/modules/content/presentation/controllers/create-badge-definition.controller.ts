import { Body, Controller, Post } from '@nestjs/common';

import { CreateBadgeDefinitionUseCase } from '../../application/create-badge-definition.use-case.js';
import { CreateBadgeDefinitionRequestDto } from '../dto/create-badge-definition.dto.js';
import { BadgeDefinitionPresenter } from '../presenters.js';
import { AdminOnly } from './admin-crud.shared.js';

@Controller('v1/api/admin/badges')
export class CreateBadgeDefinitionController {
  constructor(private readonly createBadge: CreateBadgeDefinitionUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateBadgeDefinitionRequestDto) {
    return BadgeDefinitionPresenter.toResponse(
      await this.createBadge.execute(dto),
    );
  }
}
