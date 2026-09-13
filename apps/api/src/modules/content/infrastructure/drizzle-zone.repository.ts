import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { zones, type Database } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { Zone } from "../domain/entities/zone.entity.js";
import { ZoneRepository } from "../domain/ports/zone.repository.js";

type ZoneRow = typeof zones.$inferSelect;

function toDomain(row: ZoneRow): Zone {
  return new Zone(row.id, row.regionId, row.name, row.slug, row.description, row.sortOrder);
}

@Injectable()
export class DrizzleZoneRepository implements ZoneRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findByRegionId(regionId: number): Promise<Zone[]> {
    const rows = await this.database
      .select()
      .from(zones)
      .where(eq(zones.regionId, regionId))
      .orderBy(asc(zones.sortOrder));
    return rows.map(toDomain);
  }
}
