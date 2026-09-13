import { Body, Controller, Post } from '@nestjs/common';

import { CreateRegionUseCase } from '../../application/create-region.use-case.js';
import { CreateRegionRequestDto } from '../dto/create-region.dto.js';
import { RegionPresenter } from '../presenters.js';
import { AdminOnly } from './admin-crud.shared.js';

@Controller('v1/api/admin/regions')
export class CreateRegionController {
  constructor(private readonly createRegion: CreateRegionUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateRegionRequestDto) {
    return RegionPresenter.toResponse(await this.createRegion.execute(dto));
  }
}
