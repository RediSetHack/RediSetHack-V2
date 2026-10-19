import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ContributorDraftReviewListSchema, ContributorDraftReviewSchema, ContributorReviewQueueSchema, ReviewDecisionInputSchema, UnpublishInputSchema } from "@repo/contracts";

import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import { AdminGuard } from "../../../auth/presentation/guards/admin.guard.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { ContributorDraftsUseCase } from "../../application/contributor-drafts.use-case.js";
import { DraftNotFoundError, DraftReviewConflictError } from "../../domain/errors.js";
import type { DraftRecord } from "../../domain/ports/draft.repository.js";

const presentDraft = (draft: DraftRecord) => ({
  id: draft.id, ownerId: draft.ownerId, zoneId: draft.zoneId, title: draft.title, lessonContent: draft.lessonContent,
  status: draft.status, revision: draft.revision, submittedRevision: draft.submittedRevision,
  createdAt: draft.createdAt.toISOString(), updatedAt: draft.updatedAt.toISOString(), submittedAt: draft.submittedAt?.toISOString() ?? null,
});

function translate(error: unknown): never {
  if (error instanceof DraftNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof DraftReviewConflictError) throw new ConflictException(error.message);
  throw error;
}

@ApiTags("Content Moderation")
@Controller("v1/api/admin/contributor-drafts")
@UseGuards(ClerkAuthGuard, AdminGuard)
@ApiBearerAuth()
@ApiForbiddenResponse({ description: "Only moderators may review or unpublish Lessons." })
export class ContributorReviewController {
  constructor(private readonly drafts: ContributorDraftsUseCase) {}

  @Get("queue")
  @ApiOperation({ summary: "List submitted contributor revisions awaiting moderation." })
  @ApiZodResponse(ContributorReviewQueueSchema)
  async queue() {
    return (await this.drafts.reviewQueue()).map(presentDraft);
  }

  @Get(":draftId/reviews")
  @ApiOperation({ summary: "List the immutable moderation history for a draft." })
  @ApiZodResponse(ContributorDraftReviewListSchema)
  async reviews(@Param("draftId", ParseIntPipe) id: number) {
    try {
      return (await this.drafts.reviewHistory(id)).map((r) => ({ ...r, reviewedAt: r.reviewedAt.toISOString() }));
    } catch (error) { return translate(error); }
  }

  @Post(":draftId/review")
  @ApiOperation({ summary: "Approve, reject, or request revision of one submitted revision." })
  @ApiZodResponse(ContributorDraftReviewSchema, { status: 201 })
  @ApiBadRequestResponse({ description: "The decision or required reason is invalid." })
  @ApiNotFoundResponse({ description: "Draft not found." })
  @ApiConflictResponse({ description: "The draft is no longer awaiting review." })
  async review(@Param("draftId", ParseIntPipe) id: number, @Body() body: unknown, @CurrentUser() user: ClerkAuthenticatedUser) {
    const parsed = ReviewDecisionInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join("; "));
    try {
      const review = await this.drafts.review(id, user.id, parsed.data);
      return { ...review, reviewedAt: review.reviewedAt.toISOString() };
    } catch (error) { return translate(error); }
  }

  @Post(":draftId/unpublish")
  @ApiOperation({ summary: "Unpublish a Lesson while preserving its historical learner records." })
  @ApiZodResponse(ContributorDraftReviewSchema, { status: 201 })
  @ApiBadRequestResponse({ description: "A reason is required." })
  @ApiNotFoundResponse({ description: "Draft not found." })
  @ApiConflictResponse({ description: "The Lesson is already unpublished or was never approved." })
  async unpublish(@Param("draftId", ParseIntPipe) id: number, @Body() body: unknown, @CurrentUser() user: ClerkAuthenticatedUser) {
    const parsed = UnpublishInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join("; "));
    try {
      const review = await this.drafts.unpublish(id, user.id, parsed.data.reason);
      return { ...review, reviewedAt: review.reviewedAt.toISOString() };
    } catch (error) { return translate(error); }
  }
}
