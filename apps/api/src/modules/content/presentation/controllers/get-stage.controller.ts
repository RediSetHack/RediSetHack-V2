import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetStageUseCase } from '../../application/get-stage.use-case.js';
import { StagePresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Stages')
@Controller('v1/api/admin/stages')
export class GetStageController {
  constructor(private readonly getStage: GetStageUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Stage by id.' })
  @ApiIdParam('Stage')
  @ApiEntityNotFound('Stage')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return StagePresenter.toResponse(await this.getStage.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
