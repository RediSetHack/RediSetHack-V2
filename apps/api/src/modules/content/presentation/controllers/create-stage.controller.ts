import { Body, Controller, Post } from '@nestjs/common';

import { CreateStageUseCase } from '../../application/create-stage.use-case.js';
import { CreateStageRequestDto } from '../dto/create-stage.dto.js';
import { StagePresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/stages')
export class CreateStageController {
  constructor(private readonly createStage: CreateStageUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateStageRequestDto) {
    try {
      return StagePresenter.toResponse(await this.createStage.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
