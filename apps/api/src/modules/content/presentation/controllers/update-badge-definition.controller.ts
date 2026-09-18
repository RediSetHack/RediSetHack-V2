import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { UpdateBadgeDefinitionUseCase } from '../../application/update-badge-definition.use-case.js';
import { UpdateBadgeDefinitionRequestDto } from '../dto/update-badge-definition.dto.js';
import { BadgeDefinitionPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Badges')
@Controller('v1/api/admin/badges')
export class UpdateBadgeDefinitionController {
  constructor(private readonly updateBadge: UpdateBadgeDefinitionUseCase) {}
  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update a Badge definition.' })
  @ApiParam({ name: 'id', description: "The Badge definition's id." })
  @ApiEntityNotFound('Badge definition')
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBadgeDefinitionRequestDto,
  ) {
    try {
      return BadgeDefinitionPresenter.toResponse(
        await this.updateBadge.execute(id, dto),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}
