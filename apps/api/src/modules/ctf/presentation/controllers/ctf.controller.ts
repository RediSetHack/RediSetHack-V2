import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CtfArtifactResponseSchema,
  CtfAttemptResponseSchema,
  CtfChallengeListResponseSchema,
  CtfChallengeResponseSchema,
} from '@repo/contracts';

import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator.js';
import type { ClerkAuthenticatedUser } from '../../../auth/domain/ports/clerk-auth.port.js';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { StageLockedError, StageNotFoundError } from '../../../progress/domain/errors.js';
import { CtfUseCase } from '../../application/ctf.use-case.js';
import { CtfChallengeNotFoundError, CtfRateLimitError } from '../../domain/errors.js';
import { SubmitFlagDto } from '../dto/submit-flag.dto.js';

function translate(error: unknown): never {
  if (error instanceof StageLockedError) throw new ForbiddenException(error.message);
  if (error instanceof StageNotFoundError || error instanceof CtfChallengeNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof CtfRateLimitError) throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
  throw error;
}

@ApiTags('CTF')
@Controller('v1/api/ctf')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class CtfController {
  constructor(private readonly ctf: CtfUseCase) {}

  @Get('challenges')
  @ApiOperation({ summary: 'List the CTF challenges the learner is eligible for (no artifacts or answers).' })
  @ApiZodResponse(CtfChallengeListResponseSchema)
  list(@CurrentUser() learner: ClerkAuthenticatedUser) {
    return this.ctf.list(learner.id);
  }

  @Get('challenges/:challengeId')
  @ApiOperation({ summary: 'Open a challenge brief.' })
  @ApiZodResponse(CtfChallengeResponseSchema)
  @ApiForbiddenResponse({ description: 'The parent Stage is locked for this learner.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  async view(@Param('challengeId', ParseIntPipe) challengeId: number, @CurrentUser() learner: ClerkAuthenticatedUser) {
    try {
      return await this.ctf.view(learner.id, challengeId);
    } catch (error) {
      return translate(error);
    }
  }

  @Get('challenges/:challengeId/artifact')
  @ApiOperation({ summary: 'Download the challenge artifact (stage-gated; the only door to it).' })
  @ApiZodResponse(CtfArtifactResponseSchema)
  @ApiForbiddenResponse({ description: 'The parent Stage is locked for this learner.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  async artifact(@Param('challengeId', ParseIntPipe) challengeId: number, @CurrentUser() learner: ClerkAuthenticatedUser) {
    try {
      return await this.ctf.artifact(learner.id, challengeId);
    } catch (error) {
      return translate(error);
    }
  }

  @Post('challenges/:challengeId/attempts')
  @ApiOperation({ summary: 'Submit a flag; completion, XP and the learning event are recorded exactly once.' })
  @ApiZodResponse(CtfAttemptResponseSchema, { status: 201 })
  @ApiForbiddenResponse({ description: 'The parent Stage is locked for this learner.' })
  @ApiNotFoundResponse({ description: 'Challenge not found.' })
  async submit(
    @Param('challengeId', ParseIntPipe) challengeId: number,
    @Body() dto: SubmitFlagDto,
    @CurrentUser() learner: ClerkAuthenticatedUser,
  ) {
    try {
      return await this.ctf.submit(learner.id, challengeId, dto.flag);
    } catch (error) {
      return translate(error);
    }
  }
}
