import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { GetStageUseCase } from '../../application/get-stage.use-case.js';
import { StagePresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Stages')
@Controller('v1/api/admin/stages')
export class GetStageController {
  constructor(private readonly getStage: GetStageUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Stage by id.' })
  @ApiParam({ name: 'id', description: "The Stage's id." })
  @ApiEntityNotFound('Stage')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return StagePresenter.toResponse(await this.getStage.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
