import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DeleteZoneUseCase } from '../../application/delete-zone.use-case.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/zones')
export class DeleteZoneController {
  constructor(private readonly deleteZone: DeleteZoneUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteZone.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
