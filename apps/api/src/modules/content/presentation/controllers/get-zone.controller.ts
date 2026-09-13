import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { GetZoneUseCase } from '../../application/get-zone.use-case.js';
import { ZonePresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/zones')
export class GetZoneController {
  constructor(private readonly getZone: GetZoneUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return ZonePresenter.toResponse(await this.getZone.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
