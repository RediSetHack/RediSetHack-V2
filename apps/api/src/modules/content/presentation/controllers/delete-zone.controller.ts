import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteZoneUseCase } from '../../application/delete-zone.use-case.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Zones')
@Controller('v1/api/admin/zones')
export class DeleteZoneController {
  constructor(private readonly deleteZone: DeleteZoneUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Zone.' })
  @ApiIdParam('Zone')
  @ApiEntityNotFound('Zone')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteZone.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
