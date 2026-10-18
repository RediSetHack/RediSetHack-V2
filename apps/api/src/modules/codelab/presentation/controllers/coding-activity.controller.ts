import {
  Body,
  Controller,
  ForbiddenException,
  GatewayTimeoutException,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CodingActivityResponseSchema, CodingAttemptResponseSchema } from '@repo/contracts';

import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator.js';
import type { ClerkAuthenticatedUser } from '../../../auth/domain/ports/clerk-auth.port.js';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { StageLockedError, StageNotFoundError } from '../../../progress/domain/errors.js';
import { GradeCodingActivityUseCase } from '../../application/grade-coding-activity.use-case.js';
import {
  CodeExecutionLimitError,
  CodeExecutionTimeoutError,
  CodeExecutionUnavailableError,
  CodingActivityNotFoundError,
  CodingAttemptNotFoundError,
} from '../../domain/errors.js';
import type { CodingAttempt } from '../../domain/entities/coding-activity.entity.js';
import { SubmitCodingAttemptDto } from '../dto/submit-coding-attempt.dto.js';

const presentAttempt = (attempt: CodingAttempt) => ({
  ...attempt,
  submittedAt: attempt.submittedAt.toISOString(),
});

function translate(error: unknown): never {
  if (error instanceof StageLockedError) throw new ForbiddenException(error.message);
  if (
    error instanceof StageNotFoundError ||
    error instanceof CodingActivityNotFoundError ||
    error instanceof CodingAttemptNotFoundError
  )
    throw new NotFoundException(error.message);
  if (error instanceof CodeExecutionLimitError) throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
  if (error instanceof CodeExecutionTimeoutError) throw new GatewayTimeoutException(error.message);
  if (error instanceof CodeExecutionUnavailableError) throw new ServiceUnavailableException(error.message);
  throw error;
}

@ApiTags('Codelab')
@Controller('v1/api/codelab')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class CodingActivityController {
  constructor(private readonly grader: GradeCodingActivityUseCase) {}

  @Get('activities/:activityId')
  @ApiOperation({ summary: 'Open a graded coding activity (hidden checks are never returned).' })
  @ApiZodResponse(CodingActivityResponseSchema)
  @ApiForbiddenResponse({ description: 'The parent Stage is locked for this learner.' })
  @ApiNotFoundResponse({ description: 'Activity not found.' })
  async view(@Param('activityId', ParseIntPipe) activityId: number, @CurrentUser() learner: ClerkAuthenticatedUser) {
    try {
      return await this.grader.view(learner.id, activityId);
    } catch (error) {
      return translate(error);
    }
  }

  @Post('activities/:activityId/attempts')
  @ApiOperation({ summary: 'Submit code for grading; records the attempt and awards XP once on first pass.' })
  @ApiZodResponse(CodingAttemptResponseSchema, { status: 201 })
  @ApiForbiddenResponse({ description: 'The parent Stage is locked for this learner.' })
  @ApiNotFoundResponse({ description: 'Activity not found.' })
  async submit(
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body() dto: SubmitCodingAttemptDto,
    @CurrentUser() learner: ClerkAuthenticatedUser,
  ) {
    try {
      return presentAttempt(await this.grader.submit(learner.id, activityId, dto.code));
    } catch (error) {
      return translate(error);
    }
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: "Review one of the learner's own attempts." })
  @ApiZodResponse(CodingAttemptResponseSchema)
  @ApiNotFoundResponse({ description: 'Attempt not found or owned by another learner.' })
  async review(@Param('attemptId', ParseUUIDPipe) attemptId: string, @CurrentUser() learner: ClerkAuthenticatedUser) {
    try {
      return presentAttempt(await this.grader.review(learner.id, attemptId));
    } catch (error) {
      return translate(error);
    }
  }
}
