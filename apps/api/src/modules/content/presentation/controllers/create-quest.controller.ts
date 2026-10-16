import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateQuestUseCase } from '../../application/create-quest.use-case.js';
import { CreateQuestRequestDto } from '../dto/create-quest.dto.js';
import { QuestPresenter } from '../presenters.js';
import { AdminOnly, ApiParentNotFound, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Quests')
@Controller('v1/api/admin/quests')
export class CreateQuestController {
  constructor(private readonly createQuest: CreateQuestUseCase) {}
  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Create a Quest under a Stage.' })
  @ApiParentNotFound('Stage')
  async handle(@Body() dto: CreateQuestRequestDto) {
    try {
      return QuestPresenter.toResponse(await this.createQuest.execute(dto));
    } catch (error) {
      asNotFound(error);
    }
  }
}
