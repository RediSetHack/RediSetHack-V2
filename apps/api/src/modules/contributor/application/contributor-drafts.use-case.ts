import { Injectable } from "@nestjs/common";
import type { CreateContributorDraft, ReviewDecisionInput, SubmitContributorDraft, UpdateContributorDraft } from "@repo/contracts";

import {
  ActivityNotFoundError,
  DraftNotFoundError,
  DraftNotOwnedError,
  DraftReviewConflictError,
  DraftRevisionConflictError,
  DraftSubmittedError,
  ParentZoneNotFoundError,
} from "../domain/errors.js";
import { DraftRepository, type DraftRecord, type DraftReviewRecord } from "../domain/ports/draft.repository.js";

@Injectable()
export class ContributorDraftsUseCase {
  constructor(private readonly drafts: DraftRepository) {}

  list(ownerId: string): Promise<DraftRecord[]> {
    return this.drafts.list(ownerId);
  }

  async get(ownerId: string, id: number): Promise<DraftRecord> {
    return this.owned(ownerId, id);
  }

  async create(ownerId: string, input: CreateContributorDraft): Promise<DraftRecord> {
    if (!(await this.drafts.zoneIsOpen(input.zoneId))) throw new ParentZoneNotFoundError(input.zoneId);
    await this.assertActivities(input.lessonContent);
    return this.drafts.create({ ownerId, ...input });
  }

  async update(ownerId: string, id: number, input: UpdateContributorDraft): Promise<DraftRecord> {
    const draft = await this.owned(ownerId, id);
    if (draft.status !== "draft" && draft.status !== "revision-needed") throw new DraftSubmittedError();
    await this.assertActivities(input.lessonContent);
    const updated = await this.drafts.update(id, input.revision, { title: input.title, lessonContent: input.lessonContent });
    if (!updated) throw await this.whyRejected(id);
    return updated;
  }

  async submit(ownerId: string, id: number, input: SubmitContributorDraft): Promise<DraftRecord> {
    const draft = await this.owned(ownerId, id);
    if (draft.status !== "draft" && draft.status !== "revision-needed") throw new DraftSubmittedError();
    const submitted = await this.drafts.submit(id, input.revision);
    if (!submitted) throw await this.whyRejected(id);
    return submitted;
  }

  reviewQueue(): Promise<DraftRecord[]> { return this.drafts.reviewQueue(); }

  async review(id: number, reviewerId: string, input: ReviewDecisionInput): Promise<DraftReviewRecord> {
    if (!(await this.drafts.findById(id))) throw new DraftNotFoundError(id);
    const review = await this.drafts.review(id, reviewerId, input);
    if (!review) throw new DraftReviewConflictError();
    return review;
  }

  async unpublish(id: number, reviewerId: string, reason: string): Promise<DraftReviewRecord> {
    if (!(await this.drafts.findById(id))) throw new DraftNotFoundError(id);
    const review = await this.drafts.unpublish(id, reviewerId, reason);
    if (!review) throw new DraftReviewConflictError();
    return review;
  }

  async reviews(ownerId: string, id: number): Promise<DraftReviewRecord[]> {
    await this.owned(ownerId, id);
    return this.drafts.reviews(id);
  }

  async reviewHistory(id: number): Promise<DraftReviewRecord[]> {
    if (!(await this.drafts.findById(id))) throw new DraftNotFoundError(id);
    return this.drafts.reviews(id);
  }

  private async owned(ownerId: string, id: number): Promise<DraftRecord> {
    const draft = await this.drafts.findById(id);
    if (!draft) throw new DraftNotFoundError(id);
    if (draft.ownerId !== ownerId) throw new DraftNotOwnedError();
    return draft;
  }

  /** A conditional write lost: either a concurrent submit froze the draft or a concurrent edit moved the revision. */
  private async whyRejected(id: number): Promise<Error> {
    const current = await this.drafts.findById(id);
    return current?.status === "submitted" ? new DraftSubmittedError() : new DraftRevisionConflictError();
  }

  private async assertActivities(blocks: CreateContributorDraft["lessonContent"]): Promise<void> {
    const ids = blocks.flatMap((b) => (b.type === "exercise" && b.activityId !== undefined ? [b.activityId] : []));
    const missing = ids.length > 0 ? await this.drafts.missingActivities([...new Set(ids)]) : [];
    if (missing.length > 0) throw new ActivityNotFoundError(missing);
  }
}
