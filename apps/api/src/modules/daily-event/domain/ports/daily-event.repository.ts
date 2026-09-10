import { DailyEvent } from "../entities/daily-event.entity.js";

export abstract class DailyEventRepository {
  abstract findByDate(date: string): Promise<DailyEvent | null>;
  abstract create(date: string, eventType: "normal" | "bonus", xpMultiplier: number): Promise<DailyEvent>;
}
