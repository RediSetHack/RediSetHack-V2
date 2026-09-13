import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DeleteQuestUseCase } from '../../application/delete-quest.use-case.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/quests')
export class DeleteQuestController {
  constructor(private readonly deleteQuest: DeleteQuestUseCase) {}
  @Delete(':id')
  @HttpCode(204)
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.deleteQuest.execute(id);
    } catch (error) {
      asNotFound(error);
    }
  }
}
