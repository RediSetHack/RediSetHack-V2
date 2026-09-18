import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionSchema } from '@repo/contracts';

import { CreateRegionUseCase } from '../../application/create-region.use-case.js';
import { CreateRegionRequestDto } from '../dto/create-region.dto.js';
import { RegionPresenter } from '../presenters.js';
import { AdminOnly } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Regions')
@Controller('v1/api/admin/regions')
export class CreateRegionController {
  constructor(private readonly createRegion: CreateRegionUseCase) {}
  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a Region.' })
  @ApiZodResponse(RegionSchema, { status: 201 })
  async handle(@Body() dto: CreateRegionRequestDto) {
    return RegionPresenter.toResponse(await this.createRegion.execute(dto));
  }
}
