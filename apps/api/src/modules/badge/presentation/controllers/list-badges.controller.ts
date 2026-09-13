import { Controller, Get } from '@nestjs/common';

import { ListBadgesUseCase } from '../../application/list-badges.use-case.js';
import { BadgePresenter } from '../presenters/badge.presenter.js';

@Controller('v1/api/badges')
export class ListBadgesController {
  constructor(private readonly listBadges: ListBadgesUseCase) {}

  @Get()
  async handle() {
    const badges = await this.listBadges.execute();
    return badges.map((badge) => BadgePresenter.toResponse(badge));
  }
}
