import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { DeleteQuestUseCase } from '../../application/delete-quest.use-case.js';
import { AdminOnly, ApiEntityNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Quests')
@Controller('v1/api/admin/quests')
export class DeleteQuestController {
  constructor(private readonly deleteQuest: DeleteQuestUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  @ApiOperation({ summary: 'Delete a Quest.' })
  @ApiParam({ name: 'id', description: "The Quest's id." })
  @ApiEntityNotFound('Quest')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteQuest.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
