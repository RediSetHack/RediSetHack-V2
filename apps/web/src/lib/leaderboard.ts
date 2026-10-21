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
 * Where a podium card sits in the visual row: 2nd on the left, 1st in the
 * middle, 3rd on the right. The markup keeps rank order so assistive tech
 * reads 1, 2, 3.
 */
export type PodiumPosition = "left" | "centre" | "right";

export interface PodiumLayout {
  position: PodiumPosition;
  /** The 1st place card is drawn taller than the other two. */
  tallest: boolean;
  /** The badge under the trophy, e.g. "1ST PLACE". */
  label: string;
}

const PODIUM_POSITION: Record<PodiumPlace, PodiumPosition> = {
  1: "centre",
  2: "left",
  3: "right",
};

const PODIUM_LABEL: Record<PodiumPlace, string> = {
  1: "1ST PLACE",
  2: "2ND PLACE",
  3: "3RD PLACE",
};

/** How a podium place is laid out on the row. */
export function podiumLayout(place: PodiumPlace): PodiumLayout {
  return {
    position: PODIUM_POSITION[place],
    tallest: place === 1,
    label: PODIUM_LABEL[place],
  };
}

/** True when the row belongs to the signed-in learner. */
export function isCurrentUser(
  entry: LeaderboardEntry,
  currentUserId: string | null,
): boolean {
  return currentUserId !== null && entry.userId === currentUserId;
}
