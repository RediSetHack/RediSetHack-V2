import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { regions, stages, userProgress, zones, type Database } from '@repo/db';

import { DB } from '../../../database/database.module.js';
import { Stage } from '../domain/entities/stage.entity.js';
import { StageRepository } from '../domain/ports/stage.repository.js';

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
    row.archivedAt,
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
    const rows = await this.database.select({ stage: stages }).from(stages)
      .innerJoin(zones, eq(stages.zoneId, zones.id)).innerJoin(regions, eq(zones.regionId, regions.id))
      .where(and(eq(stages.zoneId, zoneId), isNull(stages.archivedAt), isNull(zones.archivedAt), isNull(regions.archivedAt)))
      .orderBy(asc(stages.sortOrder));
    return rows.map(({ stage }) => toDomain(stage));
  }

  async findCompletedStageIds(
    userId: string,
    zoneId: number,
  ): Promise<number[]> {
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
