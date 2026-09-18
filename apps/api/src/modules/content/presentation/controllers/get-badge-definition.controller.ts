import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { GetBadgeDefinitionUseCase } from '../../application/get-badge-definition.use-case.js';
import { BadgeDefinitionPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Badges')
@Controller('v1/api/admin/badges')
export class GetBadgeDefinitionController {
  constructor(private readonly getBadge: GetBadgeDefinitionUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Badge definition by id.' })
  @ApiParam({ name: 'id', description: "The Badge definition's id." })
  @ApiEntityNotFound('Badge definition')
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
