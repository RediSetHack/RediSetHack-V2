import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';

import { UpdateZoneUseCase } from '../../application/update-zone.use-case.js';
import { UpdateZoneRequestDto } from '../dto/update-zone.dto.js';
import { ZonePresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/zones')
export class UpdateZoneController {
  constructor(private readonly updateZone: UpdateZoneUseCase) {}
  @Patch(':id')
  @AdminOnly()
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
