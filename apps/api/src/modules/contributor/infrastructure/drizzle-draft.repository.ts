import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import { type Database, codingActivities, contributorDraftReviews, contributorDrafts, regions, stages, zones } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { DraftRepository, type DraftRecord, type DraftReviewRecord } from "../domain/ports/draft.repository.js";
import type { ReviewDecisionInput } from "@repo/contracts";

const toRecord = (row: typeof contributorDrafts.$inferSelect): DraftRecord => ({
  ...row,
  lessonContent: row.lessonContent as DraftRecord["lessonContent"],
  status: row.status as DraftRecord["status"],
});

const toReview = (row: typeof contributorDraftReviews.$inferSelect): DraftReviewRecord => ({
  ...row,
  lessonContent: row.lessonContent as DraftReviewRecord["lessonContent"],
  decision: row.decision as DraftReviewRecord["decision"],
});

@Injectable()
export class DrizzleDraftRepository implements DraftRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async list(ownerId: string): Promise<DraftRecord[]> {
    const rows = await this.database.select().from(contributorDrafts).where(eq(contributorDrafts.ownerId, ownerId)).orderBy(contributorDrafts.id);
    return rows.map(toRecord);
  }

  async findById(id: number): Promise<DraftRecord | null> {
    const [row] = await this.database.select().from(contributorDrafts).where(eq(contributorDrafts.id, id));
    return row ? toRecord(row) : null;
  }

  async zoneIsOpen(zoneId: number): Promise<boolean> {
    const [row] = await this.database
      .select({ id: zones.id })
      .from(zones)
      .innerJoin(regions, eq(regions.id, zones.regionId))
      .where(and(eq(zones.id, zoneId), isNull(zones.archivedAt), isNull(regions.archivedAt)));
    return row !== undefined;
  }

  async missingActivities(ids: number[]): Promise<number[]> {
    const rows = await this.database.select({ id: codingActivities.id }).from(codingActivities).where(and(inArray(codingActivities.id, ids), isNull(codingActivities.archivedAt)));
    const found = new Set(rows.map((r) => r.id));
    return ids.filter((id) => !found.has(id));
  }

  async create(input: Parameters<DraftRepository["create"]>[0]): Promise<DraftRecord> {
    const [row] = await this.database.insert(contributorDrafts).values(input).returning();
    return toRecord(row!);
  }

  async update(id: number, expectedRevision: number, data: { title: string; lessonContent: DraftRecord["lessonContent"] }): Promise<DraftRecord | null> {
    const [row] = await this.database
      .update(contributorDrafts)
      .set({ ...data, status: "draft", submittedRevision: null, submittedAt: null, revision: sql`${contributorDrafts.revision} + 1`, updatedAt: new Date() })
      .where(and(eq(contributorDrafts.id, id), inArray(contributorDrafts.status, ["draft", "revision-needed"]), eq(contributorDrafts.revision, expectedRevision)))
      .returning();
    return row ? toRecord(row) : null;
  }

  async submit(id: number, expectedRevision: number): Promise<DraftRecord | null> {
    const now = new Date();
    const [row] = await this.database
      .update(contributorDrafts)
      .set({ status: "submitted", submittedRevision: expectedRevision, submittedAt: now, updatedAt: now })
      .where(and(eq(contributorDrafts.id, id), inArray(contributorDrafts.status, ["draft", "revision-needed"]), eq(contributorDrafts.revision, expectedRevision)))
      .returning();
    return row ? toRecord(row) : null;
  }

  async reviewQueue(): Promise<DraftRecord[]> {
    const rows = await this.database.select().from(contributorDrafts).where(eq(contributorDrafts.status, "submitted")).orderBy(asc(contributorDrafts.submittedAt));
    return rows.map(toRecord);
  }

  async review(id: number, reviewerId: string, input: ReviewDecisionInput): Promise<DraftReviewRecord | null> {
    return this.database.transaction(async (tx) => {
      const [draft] = await tx.select().from(contributorDrafts).where(and(eq(contributorDrafts.id, id), eq(contributorDrafts.status, "submitted")));
      if (!draft) return null;
      let publishedStageId: number | null = null;
      if (input.decision === "approved") {
        const existing = await tx.select({ sortOrder: stages.sortOrder }).from(stages).where(eq(stages.zoneId, draft.zoneId));
        const [stage] = await tx.insert(stages).values({
          zoneId: draft.zoneId,
          title: draft.title,
          slug: `${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "lesson"}-${draft.id}`,
          lessonContent: draft.lessonContent,
          xpReward: 0,
          sortOrder: Math.max(-1, ...existing.map((row) => row.sortOrder)) + 1,
        }).returning({ id: stages.id });
        publishedStageId = stage!.id;
      }
      const [changed] = await tx.update(contributorDrafts).set({
        status: input.decision,
        ...(input.decision === "revision-needed" ? { submittedRevision: null, submittedAt: null } : {}),
        updatedAt: new Date(),
      }).where(and(eq(contributorDrafts.id, id), eq(contributorDrafts.status, "submitted"))).returning();
      if (!changed) throw new Error("Draft review lost its conditional update");
      const [review] = await tx.insert(contributorDraftReviews).values({
        draftId: draft.id,
        revision: draft.submittedRevision!,
        title: draft.title,
        lessonContent: draft.lessonContent,
        decision: input.decision,
        reviewerId,
        reason: input.reason,
        publishedStageId,
      }).returning();
      return toReview(review!);
    });
  }

  async unpublish(id: number, reviewerId: string, reason: string): Promise<DraftReviewRecord | null> {
    return this.database.transaction(async (tx) => {
      const [approved] = await tx.select().from(contributorDraftReviews)
        .where(and(eq(contributorDraftReviews.draftId, id), eq(contributorDraftReviews.decision, "approved"), isNotNull(contributorDraftReviews.publishedStageId)))
        .orderBy(desc(contributorDraftReviews.reviewedAt), desc(contributorDraftReviews.id)).limit(1);
      if (!approved?.publishedStageId) return null;
      const [stage] = await tx.update(stages).set({ archivedAt: new Date() })
        .where(and(eq(stages.id, approved.publishedStageId), isNull(stages.archivedAt))).returning({ id: stages.id });
      if (!stage) return null;
      const [review] = await tx.insert(contributorDraftReviews).values({
        draftId: id, revision: approved.revision, title: approved.title, lessonContent: approved.lessonContent,
        decision: "unpublished", reviewerId, reason, publishedStageId: approved.publishedStageId,
      }).returning();
      return toReview(review!);
    });
  }

  async reviews(id: number): Promise<DraftReviewRecord[]> {
    return (await this.database.select().from(contributorDraftReviews).where(eq(contributorDraftReviews.draftId, id)).orderBy(asc(contributorDraftReviews.reviewedAt), asc(contributorDraftReviews.id))).map(toReview);
  }
}
