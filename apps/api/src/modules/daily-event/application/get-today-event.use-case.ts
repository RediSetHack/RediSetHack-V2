import { randomInt } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { DailyEvent, type EventType } from "../domain/entities/daily-event.entity.js";
import { DailyEventRepository } from "../domain/ports/daily-event.repository.js";

const PH_TZ = "Asia/Manila";
const BONUS_EVENT_PROBABILITY_PERCENT = 25;
const BONUS_XP_MULTIPLIER = 2;
const NORMAL_XP_MULTIPLIER = 1;

function todayInPH(now: Date): string {
  return now.toLocaleDateString("en-CA", { timeZone: PH_TZ });
}

function rollEvent(): { eventType: EventType; xpMultiplier: number } {
  // randomInt(0, 100) is uniform over [0, 99]; using a CSPRNG instead of
  // Math.random() satisfies SonarCloud's insecure-PRNG rule (typescript:S2245).
  const isBonus = randomInt(0, 100) < BONUS_EVENT_PROBABILITY_PERCENT;
  return isBonus
    ? { eventType: "bonus", xpMultiplier: BONUS_XP_MULTIPLIER }
    : { eventType: "normal", xpMultiplier: NORMAL_XP_MULTIPLIER };
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
