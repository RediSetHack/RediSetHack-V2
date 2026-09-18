import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ZoneSchema } from '@repo/contracts';

import { GetZoneUseCase } from '../../application/get-zone.use-case.js';
import { ZonePresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Zones')
@Controller('v1/api/admin/zones')
export class GetZoneController {
  constructor(private readonly getZone: GetZoneUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Zone by id.' })
  @ApiParam({ name: 'id', description: "The Zone's id." })
  @ApiZodResponse(ZoneSchema)
  @ApiEntityNotFound('Zone')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return ZonePresenter.toResponse(await this.getZone.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
