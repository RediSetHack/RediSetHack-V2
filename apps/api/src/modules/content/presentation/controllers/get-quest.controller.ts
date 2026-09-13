import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

import { GetQuestUseCase } from '../../application/get-quest.use-case.js';
import { QuestPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/quests')
export class GetQuestController {
  constructor(private readonly getQuest: GetQuestUseCase) {}
  @Get(':id')
  @AdminOnly()
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return QuestPresenter.toResponse(await this.getQuest.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
