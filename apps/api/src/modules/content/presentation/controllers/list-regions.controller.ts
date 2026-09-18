import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionListResponseSchema } from '@repo/contracts';

import { ListRegionsUseCase } from '../../application/list-regions.use-case.js';
import { RegionPresenter } from '../presenters/region.presenter.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Catalog Browsing')
@Controller('v1/api/regions')
export class ListRegionsController {
  constructor(private readonly listRegions: ListRegionsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List every Region in the catalog.' })
  @ApiZodResponse(RegionListResponseSchema)
  async handle() {
    const regions = await this.listRegions.execute();
    return regions.map(RegionPresenter.toResponse);
  }
}
