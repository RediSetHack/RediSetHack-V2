import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { GetBadgeDefinitionUseCase } from '../../application/get-badge-definition.use-case.js';
import { BadgeDefinitionPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/badges')
export class GetBadgeDefinitionController {
  constructor(private readonly getBadge: GetBadgeDefinitionUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return BadgeDefinitionPresenter.toResponse(
        await this.getBadge.execute(id),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}
