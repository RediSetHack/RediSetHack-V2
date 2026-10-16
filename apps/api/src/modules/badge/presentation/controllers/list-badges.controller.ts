import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListBadgesUseCase } from '../../application/list-badges.use-case.js';
import { BadgePresenter } from '../presenters/badge.presenter.js';

@ApiTags('Badges')
@Controller('v1/api/badges')
export class ListBadgesController {
  constructor(private readonly listBadges: ListBadgesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List every Badge definition in the catalog.' })
  async handle() {
    const badges = await this.listBadges.execute();
    return badges.map((badge) => BadgePresenter.toResponse(badge));
  }
}
