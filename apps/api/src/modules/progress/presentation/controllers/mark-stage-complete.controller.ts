import { Controller, BadRequestException, ForbiddenException, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { StageCompletionResponseSchema } from "@repo/contracts";

import { MarkStageCompleteUseCase } from "../../application/mark-stage-complete.use-case.js";
import { CompletedStagePresenter } from "../presenters/completed-stage.presenter.js";
import { StageAlreadyCompletedError, StageLockedError, StageNotFoundError } from "../../domain/errors.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Lessons & Progress')
@Controller("v1/api/stages")
export class MarkStageCompleteController {
  constructor(private readonly markStageComplete: MarkStageCompleteUseCase) {}

  @Post(":stageId/complete")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a Stage complete, awarding XP and Badges.' })
  @ApiParam({ name: 'stageId', description: "The Stage's id." })
  @ApiZodResponse(StageCompletionResponseSchema, { status: 201 })
  @ApiNotFoundResponse({ description: 'Stage not found.' })
  @ApiForbiddenResponse({ description: 'The Stage is locked for this User.' })
  @ApiBadRequestResponse({ description: 'The Stage is already completed.' })
  async handle(
    @Param("stageId", ParseIntPipe) stageId: number,
    @CurrentUser() user: ClerkAuthenticatedUser,
  ) {
    try {
      const completion = await this.markStageComplete.execute(user.id, stageId);
      return CompletedStagePresenter.toResponse(completion);
    } catch (error) {
      if (error instanceof StageNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof StageLockedError) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof StageAlreadyCompletedError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}