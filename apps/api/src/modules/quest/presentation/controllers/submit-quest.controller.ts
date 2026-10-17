import { StageLockedError, StageNotFoundError } from '../../../progress/domain/errors.js';
import { ForbiddenException, BadRequestException, Body, ConflictException, Controller, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiConflictResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SubmitQuestResponseSchema } from "@repo/contracts";

import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import {
  InvalidQuestResponsesError,
  QuestNotFoundError,
  QuestSessionAlreadySubmittedError,
  QuestSessionNotFoundError,
} from "../../domain/errors.js";
import { SubmitQuestUseCase } from "../../application/submit-quest.use-case.js";
import { SubmitQuestRequestDto } from "../dto/submit-quest-request.dto.js";
import { QuestResultPresenter } from "../presenters/quest-result.presenter.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Quests')
@Controller("v1/api/quests")
export class SubmitQuestController {
  constructor(private readonly submitQuest: SubmitQuestUseCase) {}

  @Post(":questId/submit")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Submit the User's answers for a Quest Session." })
  @ApiParam({ name: 'questId', description: "The Quest's id." })
  @ApiZodResponse(SubmitQuestResponseSchema, { status: 201 })
  @ApiForbiddenResponse({ description: 'The parent Stage is locked for this User.' })
  @ApiNotFoundResponse({ description: 'Quest or owned Quest Session not found.' })
  @ApiBadRequestResponse({ description: 'Responses reference unknown or duplicate questions or options.' })
  @ApiConflictResponse({ description: 'The Session was already submitted with different responses.' })
  async handle(
    @Param("questId", ParseIntPipe) questId: number,
    @Body() dto: SubmitQuestRequestDto,
    @CurrentUser() user: ClerkAuthenticatedUser,
  ) {
    try {
      const output = await this.submitQuest.execute({
        userId: user.id,
        questId,
        sessionId: dto.sessionId,
        responses: dto.responses,
      });
      return QuestResultPresenter.toSubmitResponse(output);
    } catch (error) {
      if (error instanceof StageLockedError) throw new ForbiddenException(error.message);
      if (error instanceof StageNotFoundError) throw new NotFoundException(error.message);
      if (
        error instanceof QuestNotFoundError ||
        error instanceof QuestSessionNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof InvalidQuestResponsesError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof QuestSessionAlreadySubmittedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
