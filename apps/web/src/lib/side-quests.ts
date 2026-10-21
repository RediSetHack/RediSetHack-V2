import type { SideQuestListItem } from "@/lib/api-client";

/** The chip a Side Quest status maps to; the label keeps the state in text. */
export type SideQuestChipStatus = "locked" | "unlocked" | "completed";

/**
 * The status chip for a Side Quest. `in_progress` is a Side Quest the
 * learner has started, so it reads as unlocked rather than locked.
 */
export function sideQuestStatusChip(
  status: SideQuestListItem["status"],
): { chip: SideQuestChipStatus; label: string } {
  switch (status) {
    case "completed":
      return { chip: "completed", label: "Completed" };
    case "in_progress":
      return { chip: "unlocked", label: "In progress" };
    case "available":
      return { chip: "unlocked", label: "Unlocked" };
    default:
      return { chip: "locked", label: "Locked" };
  }
}

/**
 * The text that states a requirement's state. The check and x icons are
 * decoration for it, never the only signal (`UI/PAGES.md` §0).
 */
export function requirementStateLabel(met: boolean): string {
  return met ? "Requirement met" : "Requirement not met";
}
