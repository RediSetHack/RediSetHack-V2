import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AdminGuard } from '../../../auth/presentation/guards/admin.guard.js';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { EvaluateBadgesUseCase } from '../../application/evaluate-badges.use-case.js';
import { toBadgeAwardsPresenter } from '../presenters/badge-award.presenter.js';

@ApiTags('Admin: Badges')
@Controller('v1/api/admin/badges')
export class AdminEvaluateBadgesController {
  constructor(private readonly evaluateBadges: EvaluateBadgesUseCase) {}

  @Post('evaluate/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: 'The caller is not an admin.' })
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
