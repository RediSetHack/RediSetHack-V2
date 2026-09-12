import { Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, UseGuards } from "@nestjs/common";

import { GetStageLessonUseCase } from "../../application/get-stage-lesson.use-case.js";
import { LessonPresenter } from "../presenters/lesson.presenter.js";
import { StageLockedError, StageNotFoundError } from "../../domain/errors.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";

@Controller("v1/api/stages")
export class GetStageLessonController {
  constructor(private readonly getStageLesson: GetStageLessonUseCase) {}

  @Get(":stageId/lesson")
  @UseGuards(ClerkAuthGuard)
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