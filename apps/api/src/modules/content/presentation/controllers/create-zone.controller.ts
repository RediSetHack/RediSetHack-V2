import { Body, Controller, Post } from '@nestjs/common';

import { CreateZoneUseCase } from '../../application/create-zone.use-case.js';
import { CreateZoneRequestDto } from '../dto/create-zone.dto.js';
import { ZonePresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/zones')
export class CreateZoneController {
  constructor(private readonly createZone: CreateZoneUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateZoneRequestDto) {
    try {
      return ZonePresenter.toResponse(await this.createZone.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
