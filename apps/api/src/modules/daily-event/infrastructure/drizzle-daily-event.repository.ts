import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { dailyEvents, type Database } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { DailyEvent } from "../domain/entities/daily-event.entity.js";
import { DailyEventRepository } from "../domain/ports/daily-event.repository.js";

type DailyEventRow = typeof dailyEvents.$inferSelect;

function toDomain(row: DailyEventRow): DailyEvent {
  return new DailyEvent(row.id, row.eventDate, row.eventType as "normal" | "bonus", row.xpMultiplier);
}

@Injectable()
export class DrizzleDailyEventRepository implements DailyEventRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findByDate(date: string): Promise<DailyEvent | null> {
    const row = await this.database.query.dailyEvents.findFirst({
      where: eq(dailyEvents.eventDate, date),
    });
    return row ? toDomain(row) : null;
  }

  async create(date: string, eventType: "normal" | "bonus", xpMultiplier: number): Promise<DailyEvent> {
    const inserted = await this.database
      .insert(dailyEvents)
      .values({ eventDate: date, eventType, xpMultiplier })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) {
      return toDomain(inserted[0]!);
    }

    // ponytail: race — concurrent insert lost, read what won
    const existing = await this.findByDate(date);
    return existing!;
  }
}
