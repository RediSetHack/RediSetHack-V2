import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetQuestUseCase } from '../../application/get-quest.use-case.js';
import { QuestPresenter } from '../presenters.js';
import { AdminOnly, ApiEntityNotFound, ApiIdParam, asNotFound } from './admin-crud.shared.js';

@ApiTags('Admin: Quests')
@Controller('v1/api/admin/quests')
export class GetQuestController {
  constructor(private readonly getQuest: GetQuestUseCase) {}
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get a Quest by id.' })
  @ApiIdParam('Quest')
  @ApiEntityNotFound('Quest')
  async handle(@Param('id', ParseIntPipe) id: number) {
    try {
      return QuestPresenter.toResponse(await this.getQuest.execute(id));
    } catch (error) {
      asNotFound(error);
    }
  }
}
