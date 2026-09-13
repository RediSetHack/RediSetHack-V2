import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';

import { UpdateRegionUseCase } from '../../application/update-region.use-case.js';
import { UpdateRegionRequestDto } from '../dto/update-region.dto.js';
import { RegionPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/regions')
export class UpdateRegionController {
  constructor(private readonly updateRegion: UpdateRegionUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegionRequestDto,
  ) {
    try {
      return RegionPresenter.toResponse(
        await this.updateRegion.execute(id, dto),
      );
    } catch (error) {
      asNotFound(error);
    }
  }
}
