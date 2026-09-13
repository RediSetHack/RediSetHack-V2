import { Body, Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';

import { UpdateQuestUseCase } from '../../application/update-quest.use-case.js';
import { UpdateQuestRequestDto } from '../dto/update-quest.dto.js';
import { QuestPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/quests')
export class UpdateQuestController {
  constructor(private readonly updateQuest: UpdateQuestUseCase) {}
  @Patch(':id')
  @AdminOnly()
  async handle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestRequestDto,
  ) {
    try {
      return QuestPresenter.toResponse(await this.updateQuest.execute(id, dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
