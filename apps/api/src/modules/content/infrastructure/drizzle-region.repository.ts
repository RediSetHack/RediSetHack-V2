import { Inject, Injectable } from '@nestjs/common';
import { asc, isNull } from 'drizzle-orm';
import { regions, type Database } from '@repo/db';

import { DB } from '../../../database/database.module.js';
import { Region } from '../domain/entities/region.entity.js';
import { RegionRepository } from '../domain/ports/region.repository.js';

type RegionRow = typeof regions.$inferSelect;

function toDomain(row: RegionRow): Region {
  return new Region(
    row.id,
    row.name,
    row.slug,
    row.description,
    row.sortOrder,
    row.archivedAt,
    row.storyIntro,
  );
}

@Injectable()
export class DrizzleRegionRepository implements RegionRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findAll(): Promise<Region[]> {
    const rows = await this.database
      .select()
      .from(regions)
      .where(isNull(regions.archivedAt))
      .orderBy(asc(regions.sortOrder));
    return rows.map(toDomain);
  }
}
