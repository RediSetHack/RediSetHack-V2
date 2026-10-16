import { Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { LessonResponseSchema } from "@repo/contracts";

import { GetStageLessonUseCase } from "../../application/get-stage-lesson.use-case.js";
import { LessonPresenter } from "../presenters/lesson.presenter.js";
import { StageLockedError, StageNotFoundError } from "../../domain/errors.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";

@ApiTags('Lessons & Progress')
@Controller("v1/api/stages")
export class GetStageLessonController {
  constructor(private readonly getStageLesson: GetStageLessonUseCase) {}

  @Get(":stageId/lesson")
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a Stage's Lesson." })
  @ApiParam({ name: 'stageId', description: "The Stage's id." })
  @ApiZodResponse(LessonResponseSchema)
  @ApiNotFoundResponse({ description: 'Stage not found.' })
  @ApiForbiddenResponse({ description: 'The Stage is locked for this User.' })
  async handle(
    @Param("stageId", ParseIntPipe) stageId: number,
    @CurrentUser() user: ClerkAuthenticatedUser,
  ) {
    try {
      const lesson = await this.getStageLesson.execute(user.id, stageId);
      return LessonPresenter.toResponse(lesson);
    } catch (error) {
      if (error instanceof StageNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof StageLockedError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}