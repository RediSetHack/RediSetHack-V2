import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { DeleteZoneUseCase } from '../../application/delete-zone.use-case.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Zones')
@Controller('v1/api/admin/zones')
export class DeleteZoneController {
  constructor(private readonly deleteZone: DeleteZoneUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Zone.' })
  @ApiParam({ name: 'id', description: "The Zone's id." })
  @ApiEntityNotFound('Zone')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteZone.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
