import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RegionSchema } from '@repo/contracts';

import { GetRegionUseCase } from '../../application/get-region.use-case.js';
import { RegionPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Regions')
@Controller('v1/api/admin/regions')
export class GetRegionController {
  constructor(private readonly getRegion: GetRegionUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Region by id.' })
  @ApiParam({ name: 'id', description: "The Region's id." })
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
