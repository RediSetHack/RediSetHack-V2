import type { LearningDay } from "@repo/contracts";

export const LEARNING_TIME_ZONE = "Asia/Manila";
export const MAX_STREAK_RANGE_DAYS = 366;
export const DEFAULT_STREAK_RANGE_DAYS = 365;

const DAY_MS = 86_400_000;

export class InvalidStreakRangeError extends Error {}

/** Asia/Manila calendar day (YYYY-MM-DD) containing the instant. */
export function manilaDay(instant: Date): string {
  return instant.toLocaleDateString("en-CA", { timeZone: LEARNING_TIME_ZONE });
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

function isCalendarDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && addDays(day, 0) === day;
}

export function resolveRange(today: string, from?: string, to?: string): { from: string; to: string } {
  const end = to ?? today;
  const start = from ?? addDays(end, -(DEFAULT_STREAK_RANGE_DAYS - 1));
  if (!isCalendarDay(start) || !isCalendarDay(end)) throw new InvalidStreakRangeError("Dates must be valid YYYY-MM-DD days.");
  if (end > today) throw new InvalidStreakRangeError("The range cannot extend into the future.");
  if (start > end) throw new InvalidStreakRangeError("`from` must not be after `to`.");
  if ((Date.parse(end) - Date.parse(start)) / DAY_MS + 1 > MAX_STREAK_RANGE_DAYS) {
    throw new InvalidStreakRangeError(`The range is limited to ${MAX_STREAK_RANGE_DAYS} days.`);
  }
  return { from: start, to: end };
}

/**
 * `history` holds qualifying activity per Asia/Manila day for the learner's whole history.
 * A streak is consecutive days with at least one qualifying accomplishment. The current streak
 * is still alive while today has no activity yet (it counts back from yesterday) and ends
 * once a whole day passes empty.
 */
export function buildLearningStreak(history: readonly LearningDay[], today: string, range: { from: string; to: string }) {
  const byDay = new Map(history.map((d) => [d.date, d]));
  const active = [...byDay.keys()].filter((d) => d <= today).sort();

  let longestStreak = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of active) {
    run = previous !== undefined && addDays(previous, 1) === day ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = day;
  }

  let currentStreak = 0;
  for (let day = byDay.has(today) ? today : addDays(today, -1); byDay.has(day); day = addDays(day, -1)) currentStreak++;

  const days: LearningDay[] = [];
  for (let day = range.from; day <= range.to; day = addDays(day, 1)) {
    days.push(byDay.get(day) ?? { date: day, reading: 0, assessed: 0 });
  }
  return { timeZone: LEARNING_TIME_ZONE as typeof LEARNING_TIME_ZONE, today, ...range, currentStreak, longestStreak, days };
}
