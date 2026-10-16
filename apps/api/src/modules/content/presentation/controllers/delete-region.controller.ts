import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteRegionUseCase } from '../../application/delete-region.use-case.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Regions')
@Controller('v1/api/admin/regions')
export class DeleteRegionController {
  constructor(private readonly deleteRegion: DeleteRegionUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Region.' })
  @ApiIdParam('Region')
  @ApiEntityNotFound('Region')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteRegion.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
