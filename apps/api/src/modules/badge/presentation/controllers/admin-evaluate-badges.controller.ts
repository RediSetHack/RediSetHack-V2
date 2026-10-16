import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AdminOnly } from '../../../content/presentation/controllers/admin-crud.shared.js';
import { EvaluateBadgesUseCase } from '../../application/evaluate-badges.use-case.js';
import { toBadgeAwardsPresenter } from '../presenters/badge-award.presenter.js';

@ApiTags('Admin: Badges')
@Controller('v1/api/admin/badges')
export class AdminEvaluateBadgesController {
  constructor(private readonly evaluateBadges: EvaluateBadgesUseCase) {}

  @Post('evaluate/:userId')
  @HttpCode(HttpStatus.OK)
  @AdminOnly()
  @ApiOperation({
    summary:
      'Evaluate and award any pending or missed Badges for a specific learner.',
  })
  @ApiParam({
    name: 'userId',
    description: 'The learner user ID to evaluate.',
  })
  @ApiResponse({
    status: 200,
    description: 'The Badges newly awarded during this evaluation.',
  })
  async handle(@Param('userId') userId: string) {
    const awarded = await this.evaluateBadges.execute(userId);
    return toBadgeAwardsPresenter(awarded);
  }
}
