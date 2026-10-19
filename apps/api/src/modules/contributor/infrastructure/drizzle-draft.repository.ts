import { Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { type Database, codingActivities, contributorDrafts, regions, zones } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { DraftRepository, type DraftRecord } from "../domain/ports/draft.repository.js";

const toRecord = (row: typeof contributorDrafts.$inferSelect): DraftRecord => ({
  ...row,
  lessonContent: row.lessonContent as DraftRecord["lessonContent"],
  status: row.status as DraftRecord["status"],
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
      .set({ ...data, revision: sql`${contributorDrafts.revision} + 1`, updatedAt: new Date() })
      .where(and(eq(contributorDrafts.id, id), eq(contributorDrafts.status, "draft"), eq(contributorDrafts.revision, expectedRevision)))
      .returning();
    return row ? toRecord(row) : null;
  }

  async submit(id: number, expectedRevision: number): Promise<DraftRecord | null> {
    const now = new Date();
    const [row] = await this.database
      .update(contributorDrafts)
      .set({ status: "submitted", submittedRevision: expectedRevision, submittedAt: now, updatedAt: now })
      .where(and(eq(contributorDrafts.id, id), eq(contributorDrafts.status, "draft"), eq(contributorDrafts.revision, expectedRevision)))
      .returning();
    return row ? toRecord(row) : null;
  }
}
