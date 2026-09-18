import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UpdateStageUseCase } from '../../application/update-stage.use-case.js';
import { UpdateStageRequestDto } from '../dto/update-stage.dto.js';
import { StagePresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Stages')
@Controller('v1/api/admin/stages')
export class UpdateStageController {
  constructor(private readonly updateStage: UpdateStageUseCase) {}
  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update a Stage.' })
  @ApiIdParam('Stage')
  @ApiEntityNotFound('Stage')
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStageRequestDto,
  ) {
    try {
      return StagePresenter.toResponse(await this.updateStage.execute(id, dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
