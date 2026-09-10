import { Injectable } from "@nestjs/common";

import { DailyEvent, type EventType } from "../domain/entities/daily-event.entity.js";
import { DailyEventRepository } from "../domain/ports/daily-event.repository.js";

const PH_TZ = "Asia/Manila";

function todayInPH(now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: PH_TZ });
}

function rollEvent(): { eventType: EventType; xpMultiplier: number } {
  const isBonus = Math.random() >= 0.75;
  return isBonus
    ? { eventType: "bonus", xpMultiplier: 2 }
    : { eventType: "normal", xpMultiplier: 1 };
}

@Injectable()
export class GetTodayEventUseCase {
  constructor(private readonly repo: DailyEventRepository) {}

  async execute(): Promise<DailyEvent> {
    const today = todayInPH(new Date());
    const existing = await this.repo.findByDate(today);
    if (existing) return existing;

    const { eventType, xpMultiplier } = rollEvent();
    return this.repo.create(today, eventType, xpMultiplier);
  }
}
