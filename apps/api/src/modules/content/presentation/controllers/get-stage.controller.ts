import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { GetStageUseCase } from '../../application/get-stage.use-case.js';
import { StagePresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/stages')
export class GetStageController {
  constructor(private readonly getStage: GetStageUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return StagePresenter.toResponse(await this.getStage.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
