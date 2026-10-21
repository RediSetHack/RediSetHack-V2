import type { LeaderboardEntry } from "@/lib/api-client";

/**
 * The three places on the podium, in rank order.
 */
export type PodiumPlace = 1 | 2 | 3;

export interface PodiumEntry {
  entry: LeaderboardEntry;
  place: PodiumPlace;
}

/** The API allows a null display name; the podium and table fall back to "Anonymous". */
export function displayName(entry: LeaderboardEntry): string {
  return entry.name ?? "Anonymous";
}

/**
 * The podium belongs to page 1 only, and only to the ranks that actually
 * exist: a leaderboard with two learners gets two cards, never an empty third.
 */
export function podiumEntries(
  entries: readonly LeaderboardEntry[],
  page: number,
): PodiumEntry[] {
  if (page !== 1) return [];

  const podium: PodiumEntry[] = [];
  for (const entry of entries) {
    if (entry.rank === 1 || entry.rank === 2 || entry.rank === 3) {
      podium.push({ entry, place: entry.rank });
    }
  }
  return podium.sort((a, b) => a.place - b.place);
}

/**
 * Visual order of the podium: 2nd on the left, 1st in the middle, 3rd on the
 * right. The markup keeps rank order so assistive tech reads 1, 2, 3.
 */
const PODIUM_ORDER_CLASS: Record<PodiumPlace, string> = {
  1: "sm:order-2",
  2: "sm:order-1",
  3: "sm:order-3",
};

export function podiumOrderClass(place: PodiumPlace): string {
  return PODIUM_ORDER_CLASS[place];
}

/** The badge under each podium card, e.g. "1ST PLACE". */
export function podiumPlaceLabel(place: PodiumPlace): string {
  return place === 1 ? "1ST PLACE" : place === 2 ? "2ND PLACE" : "3RD PLACE";
}

/** True when the row belongs to the signed-in learner. */
export function isCurrentUser(
  entry: LeaderboardEntry,
  currentUserId: string | null,
): boolean {
  return currentUserId !== null && entry.userId === currentUserId;
}

/**
 * The signed-in learner's own row on the loaded page, or null when they are
 * not on it (they sit on another page of the leaderboard).
 */
export function findCurrentUserEntry(
  entries: readonly LeaderboardEntry[],
  currentUserId: string | null,
): LeaderboardEntry | null {
  if (currentUserId === null) return null;
  return entries.find((entry) => entry.userId === currentUserId) ?? null;
}
