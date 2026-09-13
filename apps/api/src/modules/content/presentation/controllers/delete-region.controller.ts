import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DeleteRegionUseCase } from '../../application/delete-region.use-case.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/regions')
export class DeleteRegionController {
  constructor(private readonly deleteRegion: DeleteRegionUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteRegion.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
