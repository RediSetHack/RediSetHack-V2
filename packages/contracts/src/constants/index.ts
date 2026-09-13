/**
 * Shared constants for API boundary defaults. These mirror the DB-level
 * defaults in `packages/db/src/schema.ts` and the in-code defaults used by
 * `apps/api` use-cases, but this package has no dependency on `@repo/db` —
 * keep any future edits here in sync by hand.
 */

/** Daily-event type: "bonus" days apply DEFAULT_XP_MULTIPLIER * 2 to XP awards. */
export type EventType = "normal" | "bonus";

/** Default minimum score (0-100) a quest submission must reach to pass. */
export const DEFAULT_PASSING_SCORE = 70;

/** Default time limit, in seconds, allotted to a quest attempt. */
export const DEFAULT_TIME_LIMIT_SECONDS = 60;

/** Default XP multiplier applied on a normal (non-bonus) day. */
export const DEFAULT_XP_MULTIPLIER = 1;
