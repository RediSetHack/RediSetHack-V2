import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { stages, userProgress, type Database } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { Stage } from "../domain/entities/stage.entity.js";
import { StageRepository } from "../domain/ports/stage.repository.js";

type StageRow = typeof stages.$inferSelect;

function toDomain(row: StageRow): Stage {
  return new Stage(
    row.id,
    row.zoneId,
    row.title,
    row.slug,
    row.lessonContent,
    row.xpReward,
    row.sortOrder,
  );
}

@Injectable()
export class DrizzleStageRepository implements StageRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(stageId: number): Promise<Stage | null> {
    const row = await this.database.query.stages.findFirst({
      where: eq(stages.id, stageId),
    });
    return row ? toDomain(row) : null;
  }

  async findByZoneId(zoneId: number): Promise<Stage[]> {
    const rows = await this.database
      .select()
      .from(stages)
      .where(eq(stages.zoneId, zoneId))
      .orderBy(asc(stages.sortOrder));
    return rows.map(toDomain);
  }

  async findCompletedStageIds(userId: string, zoneId: number): Promise<number[]> {
    const rows = await this.database
      .select({ stageId: userProgress.stageId })
      .from(userProgress)
      .innerJoin(stages, eq(userProgress.stageId, stages.id))
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.completed, true),
          eq(stages.zoneId, zoneId),
        ),
      );
    return rows.map((r) => r.stageId);
  }
}
