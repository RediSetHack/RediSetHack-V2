import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteBadgeDefinitionUseCase } from '../../application/delete-badge-definition.use-case.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Badges')
@Controller('v1/api/admin/badges')
export class DeleteBadgeDefinitionController {
  constructor(private readonly deleteBadge: DeleteBadgeDefinitionUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Badge definition.' })
  @ApiIdParam('Badge definition')
  @ApiEntityNotFound('Badge definition')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteBadge.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
