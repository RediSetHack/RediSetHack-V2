import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteStageUseCase } from '../../application/delete-stage.use-case.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Stages')
@Controller('v1/api/admin/stages')
export class DeleteStageController {
  constructor(private readonly deleteStage: DeleteStageUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Stage.' })
  @ApiIdParam('Stage')
  @ApiEntityNotFound('Stage')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteStage.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
