import { Body, Controller, Post } from '@nestjs/common';

import { CreateQuestUseCase } from '../../application/create-quest.use-case.js';
import { CreateQuestRequestDto } from '../dto/create-quest.dto.js';
import { QuestPresenter } from '../presenters.js';
import { AdminOnly, asNotFound } from './admin-crud.shared.js';

@Controller('v1/api/admin/quests')
export class CreateQuestController {
  constructor(private readonly createQuest: CreateQuestUseCase) {}
  @Post()
  @AdminOnly()
  async handle(@Body() dto: CreateQuestRequestDto) {
    try {
      return QuestPresenter.toResponse(await this.createQuest.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
