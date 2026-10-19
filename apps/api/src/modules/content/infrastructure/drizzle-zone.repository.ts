import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { regions, zones, type Database } from '@repo/db';

import { DB } from '../../../database/database.module.js';
import { Zone } from '../domain/entities/zone.entity.js';
import { ZoneRepository } from '../domain/ports/zone.repository.js';

type ZoneRow = typeof zones.$inferSelect;

function toDomain(row: ZoneRow): Zone {
  return new Zone(
    row.id,
    row.regionId,
    row.name,
    row.slug,
    row.description,
    row.sortOrder,
    row.archivedAt,
  );
}

@Injectable()
export class DrizzleZoneRepository implements ZoneRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findByRegionId(regionId: number): Promise<Zone[]> {
    const rows = await this.database.select({ zone: zones }).from(zones)
      .innerJoin(regions, eq(zones.regionId, regions.id))
      .where(and(eq(zones.regionId, regionId), isNull(zones.archivedAt), isNull(regions.archivedAt)))
      .orderBy(asc(zones.sortOrder));
    return rows.map(({ zone }) => toDomain(zone));
  }

  async findAll(): Promise<Zone[]> {
    const rows = await this.database.select({ zone: zones }).from(zones)
      .innerJoin(regions, eq(zones.regionId, regions.id))
      .where(and(isNull(zones.archivedAt), isNull(regions.archivedAt)))
      .orderBy(asc(regions.sortOrder), asc(zones.sortOrder));
    return rows.map(({ zone }) => toDomain(zone));
  }
}
