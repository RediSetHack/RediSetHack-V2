import { Injectable } from "@nestjs/common";
import type { CreateContributorDraft, SubmitContributorDraft, UpdateContributorDraft } from "@repo/contracts";

import {
  ActivityNotFoundError,
  DraftNotFoundError,
  DraftNotOwnedError,
  DraftRevisionConflictError,
  DraftSubmittedError,
  ParentZoneNotFoundError,
} from "../domain/errors.js";
import { DraftRepository, type DraftRecord } from "../domain/ports/draft.repository.js";

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
    if (draft.status === "submitted") throw new DraftSubmittedError();
    await this.assertActivities(input.lessonContent);
    const updated = await this.drafts.update(id, input.revision, { title: input.title, lessonContent: input.lessonContent });
    if (!updated) throw await this.whyRejected(id);
    return updated;
  }

  async submit(ownerId: string, id: number, input: SubmitContributorDraft): Promise<DraftRecord> {
    const draft = await this.owned(ownerId, id);
    if (draft.status === "submitted") throw new DraftSubmittedError();
    const submitted = await this.drafts.submit(id, input.revision);
    if (!submitted) throw await this.whyRejected(id);
    return submitted;
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
