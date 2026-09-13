// XP required to reach a level grows quadratically (level n starts at
// (n-1)^2 * XP_PER_LEVEL), so later levels take progressively more XP.
// ponytail: XP_PER_LEVEL is the only tuning knob; adjust here if pacing
// needs to change rather than reworking the formula.
const XP_PER_LEVEL = 100;

export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(Math.max(totalXp, 0) / XP_PER_LEVEL)) + 1;
}
