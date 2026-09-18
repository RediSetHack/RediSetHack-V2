import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionSchema } from '@repo/contracts';

import { GetRegionUseCase } from '../../application/get-region.use-case.js';
import { RegionPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Regions')
@Controller('v1/api/admin/regions')
export class GetRegionController {
  constructor(private readonly getRegion: GetRegionUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Region by id.' })
  @ApiIdParam('Region')
  @ApiZodResponse(RegionSchema)
  @ApiEntityNotFound('Region')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return RegionPresenter.toResponse(await this.getRegion.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
