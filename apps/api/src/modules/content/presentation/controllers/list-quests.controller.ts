import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListQuestsUseCase } from '../../application/list-quests.use-case.js';
import { QuestPresenter } from '../presenters.js';
import { AdminOnly } from './admin-crud.shared.js';

@ApiTags('Admin: Quests')
@Controller('v1/api/admin/quests')
export class ListQuestsController {
  constructor(private readonly listQuests: ListQuestsUseCase) {}

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: 'List Quests for administration.' })
  async handle() {
    return (await this.listQuests.execute()).map(QuestPresenter.toResponse);
  }
}
