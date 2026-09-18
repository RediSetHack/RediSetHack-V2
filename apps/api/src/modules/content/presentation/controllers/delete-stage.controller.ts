import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { DeleteStageUseCase } from '../../application/delete-stage.use-case.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Stages')
@Controller('v1/api/admin/stages')
export class DeleteStageController {
  constructor(private readonly deleteStage: DeleteStageUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Stage.' })
  @ApiParam({ name: 'id', description: "The Stage's id." })
  @ApiEntityNotFound('Stage')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteStage.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
