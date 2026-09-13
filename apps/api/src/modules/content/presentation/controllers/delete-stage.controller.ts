import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DeleteStageUseCase } from '../../application/delete-stage.use-case.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/stages')
export class DeleteStageController {
  constructor(private readonly deleteStage: DeleteStageUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteStage.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
