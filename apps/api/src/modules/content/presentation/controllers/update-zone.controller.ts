import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ZoneSchema } from '@repo/contracts';

import { UpdateZoneUseCase } from '../../application/update-zone.use-case.js';
import { UpdateZoneRequestDto } from '../dto/update-zone.dto.js';
import { ZonePresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Zones')
@Controller('v1/api/admin/zones')
export class UpdateZoneController {
  constructor(private readonly updateZone: UpdateZoneUseCase) {}
  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Update a Zone.' })
  @ApiParam({ name: 'id', description: "The Zone's id." })
  @ApiZodResponse(ZoneSchema)
  @ApiEntityNotFound('Zone')
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateZoneRequestDto,
  ) {
    try {
      return ZonePresenter.toResponse(await this.updateZone.execute(id, dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
