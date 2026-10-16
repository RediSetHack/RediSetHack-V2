import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator.js';
import type { ClerkAuthenticatedUser } from '../../../auth/domain/ports/clerk-auth.port.js';
import { EvaluateBadgesUseCase } from '../../application/evaluate-badges.use-case.js';
import { toBadgeAwardsPresenter } from '../presenters/badge-award.presenter.js';

@ApiTags('Badges')
@Controller('v1/api/badges')
export class EvaluateBadgesController {
  constructor(private readonly evaluateBadges: EvaluateBadgesUseCase) {}

  @Post('evaluate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Evaluate and award any pending or missed Badges for the authenticated learner.',
  })
  @ApiResponse({
    status: 200,
    description: 'The Badges newly awarded during this evaluation.',
  })
  async handle(@CurrentUser() user: ClerkAuthenticatedUser) {
    const awarded = await this.evaluateBadges.execute(user.id);
    return toBadgeAwardsPresenter(awarded);
  }
}
