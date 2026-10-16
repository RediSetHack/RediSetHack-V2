import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZoneSchema } from '@repo/contracts';

import { CreateZoneUseCase } from '../../application/create-zone.use-case.js';
import { CreateZoneRequestDto } from '../dto/create-zone.dto.js';
import { ZonePresenter } from '../presenters.js';
import { AdminOnly, ApiParentNotFound, asNotFound } from './admin-crud.shared.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';

@ApiTags('Admin: Zones')
@Controller('v1/api/admin/zones')
export class CreateZoneController {
  constructor(private readonly createZone: CreateZoneUseCase) {}
  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a Zone under a Region.' })
  @ApiZodResponse(ZoneSchema, { status: 201 })
  @ApiParentNotFound('Region')
  async handle(@Body() dto: CreateZoneRequestDto) {
    try {
      return ZonePresenter.toResponse(await this.createZone.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
