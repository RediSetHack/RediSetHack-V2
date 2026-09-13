import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DeleteBadgeDefinitionUseCase } from '../../application/delete-badge-definition.use-case.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/badges')
export class DeleteBadgeDefinitionController {
  constructor(private readonly deleteBadge: DeleteBadgeDefinitionUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteBadge.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
