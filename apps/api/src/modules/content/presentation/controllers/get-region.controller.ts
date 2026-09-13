import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { GetRegionUseCase } from '../../application/get-region.use-case.js';
import { RegionPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/regions')
export class GetRegionController {
  constructor(private readonly getRegion: GetRegionUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return RegionPresenter.toResponse(await this.getRegion.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
