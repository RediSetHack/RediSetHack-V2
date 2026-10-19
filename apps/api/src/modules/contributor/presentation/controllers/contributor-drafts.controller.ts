import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiConflictResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ContributorDraftListResponseSchema,
  ContributorDraftSchema,
  ContributorDraftReviewListSchema,
  CreateContributorDraftSchema,
  SubmitContributorDraftSchema,
  UpdateContributorDraftSchema,
  type ContributorDraft,
} from "@repo/contracts";
import type { ZodType } from "zod";

import { ApiZodResponse } from "../../../../swagger/api-zod-response.decorator.js";
import type { ClerkAuthenticatedUser } from "../../../auth/domain/ports/clerk-auth.port.js";
import { CurrentUser } from "../../../auth/presentation/decorators/current-user.decorator.js";
import { ClerkAuthGuard } from "../../../auth/presentation/guards/clerk-auth.guard.js";
import { ContributorDraftsUseCase } from "../../application/contributor-drafts.use-case.js";
import {
  ActivityNotFoundError,
  DraftNotFoundError,
  DraftNotOwnedError,
  DraftRevisionConflictError,
  DraftSubmittedError,
  ParentZoneNotFoundError,
  DraftReviewConflictError,
} from "../../domain/errors.js";
import type { DraftRecord } from "../../domain/ports/draft.repository.js";
import { ContributorGuard } from "../guards/contributor.guard.js";

const present = (draft: DraftRecord): ContributorDraft => ({
  id: draft.id,
  zoneId: draft.zoneId,
  title: draft.title,
  lessonContent: draft.lessonContent,
  status: draft.status,
  revision: draft.revision,
  submittedRevision: draft.submittedRevision,
  createdAt: draft.createdAt.toISOString(),
  updatedAt: draft.updatedAt.toISOString(),
  submittedAt: draft.submittedAt?.toISOString() ?? null,
});

/** Validation feedback: every problem with its field path, so the editor can point at it. */
function parse<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  throw new BadRequestException({
    message: "The draft has validation problems",
    issues: result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  });
}

function translate(error: unknown): never {
  if (error instanceof DraftNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof DraftNotOwnedError) throw new ForbiddenException(error.message);
  if (error instanceof DraftSubmittedError || error instanceof DraftRevisionConflictError || error instanceof DraftReviewConflictError) throw new ConflictException(error.message);
  if (error instanceof ParentZoneNotFoundError) throw new NotFoundException(error.message);
  if (error instanceof ActivityNotFoundError) {
    throw new BadRequestException({ message: error.message, issues: [{ path: "lessonContent", message: error.message }] });
  }
  throw error;
}

@ApiTags("Contributor Drafts")
@Controller("v1/api/contributor/drafts")
@UseGuards(ClerkAuthGuard, ContributorGuard)
@ApiBearerAuth()
@ApiForbiddenResponse({ description: "Not an approved contributor, or the draft belongs to another contributor." })
export class ContributorDraftsController {
  constructor(private readonly drafts: ContributorDraftsUseCase) {}

  @Get()
  @ApiOperation({ summary: "List the caller's own drafts." })
  @ApiZodResponse(ContributorDraftListResponseSchema)
  async list(@CurrentUser() user: ClerkAuthenticatedUser) {
    return (await this.drafts.list(user.id)).map(present);
  }

  @Get(":draftId")
  @ApiOperation({ summary: "Open one of the caller's drafts." })
  @ApiZodResponse(ContributorDraftSchema)
  @ApiNotFoundResponse({ description: "Draft not found." })
  async get(@Param("draftId", ParseIntPipe) id: number, @CurrentUser() user: ClerkAuthenticatedUser) {
    try {
      return present(await this.drafts.get(user.id, id));
    } catch (error) {
      return translate(error);
    }
  }

  @Get(":draftId/reviews")
  @ApiOperation({ summary: "List moderation decisions for the caller's own draft." })
  @ApiZodResponse(ContributorDraftReviewListSchema)
  async reviews(@Param("draftId", ParseIntPipe) id: number, @CurrentUser() user: ClerkAuthenticatedUser) {
    try {
      const records = await this.drafts.reviews(user.id, id);
      return records.map((r) => ({ ...r, reviewedAt: r.reviewedAt.toISOString() }));
    } catch (error) {
      return translate(error);
    }
  }

  @Post()
  @ApiOperation({ summary: "Create a draft Lesson inside an existing Zone." })
  @ApiZodResponse(ContributorDraftSchema, { status: 201 })
  async create(@Body() body: unknown, @CurrentUser() user: ClerkAuthenticatedUser) {
    const input = parse(CreateContributorDraftSchema, body);
    try {
      return present(await this.drafts.create(user.id, input));
    } catch (error) {
      return translate(error);
    }
  }

  @Put(":draftId")
  @ApiOperation({ summary: "Revise a draft; `revision` must be the one the edit was based on." })
  @ApiZodResponse(ContributorDraftSchema)
  @ApiConflictResponse({ description: "Stale revision, or the draft was already submitted." })
  async update(@Param("draftId", ParseIntPipe) id: number, @Body() body: unknown, @CurrentUser() user: ClerkAuthenticatedUser) {
    const input = parse(UpdateContributorDraftSchema, body);
    try {
      return present(await this.drafts.update(user.id, id, input));
    } catch (error) {
      return translate(error);
    }
  }

  @Post(":draftId/submit")
  @ApiOperation({ summary: "Submit one specific revision for review; it is immutable afterwards." })
  @ApiZodResponse(ContributorDraftSchema, { status: 201 })
  @ApiConflictResponse({ description: "Stale revision, or the draft was already submitted." })
  async submit(@Param("draftId", ParseIntPipe) id: number, @Body() body: unknown, @CurrentUser() user: ClerkAuthenticatedUser) {
    const input = parse(SubmitContributorDraftSchema, body);
    try {
      return present(await this.drafts.submit(user.id, id, input));
    } catch (error) {
      return translate(error);
    }
  }
}
