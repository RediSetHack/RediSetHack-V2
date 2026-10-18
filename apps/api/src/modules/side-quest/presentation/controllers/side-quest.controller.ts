import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  GatewayTimeoutException,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  SideQuestListResponseSchema,
  SideQuestResponseSchema,
  SideQuestStartResponseSchema,
  SideQuestSubmissionResponseSchema,
} from '@repo/contracts';

import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator.js';
import type { ClerkAuthenticatedUser } from '../../../auth/domain/ports/clerk-auth.port.js';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { CodeExecutionLimitError, CodeExecutionTimeoutError, CodeExecutionUnavailableError } from '../../../codelab/domain/errors.js';
import { CtfRateLimitError } from '../../../ctf/domain/errors.js';
import { StageLockedError } from '../../../progress/domain/errors.js';
import { SideQuestUseCase } from '../../application/side-quest.use-case.js';
import { SideQuestLockedError, SideQuestNotFoundError, SideQuestNotStartedError } from '../../domain/errors.js';
import { SubmitSideQuestDto } from '../dto/submit-side-quest.dto.js';

function translate(error: unknown): never {
  // Lock reasons travel in the body so the learner knows what to complete next.
  if (error instanceof SideQuestLockedError) throw new ForbiddenException({ message: error.message, lockReasons: error.lockReasons });
  if (error instanceof StageLockedError) throw new ForbiddenException(error.message);
  if (error instanceof SideQuestNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof SideQuestNotStartedError) throw new ConflictException(error.message);
  if (error instanceof CtfRateLimitError || error instanceof CodeExecutionLimitError)
    throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
  if (error instanceof CodeExecutionTimeoutError) throw new GatewayTimeoutException(error.message);
  if (error instanceof CodeExecutionUnavailableError) throw new ServiceUnavailableException(error.message);
  throw error;
}

@ApiTags('Side Quests')
@Controller('v1/api/side-quests')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class SideQuestController {
  constructor(private readonly sideQuests: SideQuestUseCase) {}

  @Get()
  @ApiOperation({ summary: 'List optional Side Quests with their status and lock reasons.' })
  @ApiZodResponse(SideQuestListResponseSchema)
  list(@CurrentUser() learner: ClerkAuthenticatedUser) {
    return this.sideQuests.list(learner.id);
  }

  @Get(':sideQuestId')
  @ApiOperation({ summary: 'Open a Side Quest; the brief and activity are withheld while it is locked.' })
  @ApiZodResponse(SideQuestResponseSchema)
  @ApiNotFoundResponse({ description: 'Side Quest not found.' })
  async view(@Param('sideQuestId', ParseIntPipe) id: number, @CurrentUser() learner: ClerkAuthenticatedUser) {
    try {
      return await this.sideQuests.view(learner.id, id);
    } catch (error) {
      return translate(error);
    }
  }

  @Post(':sideQuestId/start')
  @ApiOperation({ summary: 'Start an eligible Side Quest (idempotent).' })
  @ApiZodResponse(SideQuestStartResponseSchema, { status: 201 })
  @ApiForbiddenResponse({ description: 'Prerequisites are unmet; the body lists lockReasons.' })
  @ApiNotFoundResponse({ description: 'Side Quest not found.' })
  async start(@Param('sideQuestId', ParseIntPipe) id: number, @CurrentUser() learner: ClerkAuthenticatedUser) {
    try {
      return await this.sideQuests.start(learner.id, id);
    } catch (error) {
      return translate(error);
    }
  }

  @Post(':sideQuestId/submissions')
  @ApiOperation({ summary: 'Submit the designated activity; completion, XP and the learning event are recorded exactly once.' })
  @ApiZodResponse(SideQuestSubmissionResponseSchema, { status: 201 })
  @ApiForbiddenResponse({ description: 'Prerequisites are unmet; the body lists lockReasons.' })
  @ApiNotFoundResponse({ description: 'Side Quest not found.' })
  @ApiConflictResponse({ description: 'The Side Quest has not been started.' })
  async submit(
    @Param('sideQuestId', ParseIntPipe) id: number,
    @Body() dto: SubmitSideQuestDto,
    @CurrentUser() learner: ClerkAuthenticatedUser,
  ) {
    if (dto.flag === undefined && dto.code === undefined) throw new BadRequestException('Provide `flag` or `code`.');
    try {
      return await this.sideQuests.submit(learner.id, id, dto);
    } catch (error) {
      return translate(error);
    }
  }
}
