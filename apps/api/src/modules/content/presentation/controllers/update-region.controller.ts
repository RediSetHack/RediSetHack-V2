import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegionSchema } from '@repo/contracts';

import { UpdateRegionUseCase } from '../../application/update-region.use-case.js';
import { UpdateRegionRequestDto } from '../dto/update-region.dto.js';
import { RegionPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Regions')
@Controller('v1/api/admin/regions')
export class UpdateRegionController {
  constructor(private readonly updateRegion: UpdateRegionUseCase) {}
  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update a Region.' })
  @ApiIdParam('Region')
  @ApiZodResponse(RegionSchema)
  @ApiEntityNotFound('Region')
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
