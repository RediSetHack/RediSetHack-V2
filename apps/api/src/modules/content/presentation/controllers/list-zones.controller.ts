import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ZoneListResponseSchema } from '@repo/contracts';

import { ListZonesUseCase } from '../../application/list-zones.use-case.js';
import { ZonePresenter } from '../presenters/zone.presenter.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Catalog Browsing')
@Controller('v1/api/regions/:regionId/zones')
export class ListZonesController {
  constructor(private readonly listZones: ListZonesUseCase) {}

  @Get()
  @ApiOperation({ summary: "List a Region's Zones." })
  @ApiParam({ name: 'regionId', description: "The parent Region's id." })
  @ApiZodResponse(ZoneListResponseSchema)
  async handle(@Param('regionId', ParseIntPipe) regionId: number) {
    const zones = await this.listZones.execute(regionId);
    return zones.map(ZonePresenter.toResponse);
  }
}
