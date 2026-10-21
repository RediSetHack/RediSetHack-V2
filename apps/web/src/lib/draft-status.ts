import type { ContributorDraftItem } from "@/lib/api-client";

/** The chip a draft status maps to; the label keeps the state in text. */
export type DraftChipStatus = "normal" | "unlocked" | "not-passed" | "completed";

/**
 * The submission status chip of a Contributor Draft. `submitted` means the
 * revision is with the reviewers, `revision-needed` means it came back.
 */
export function draftStatusChip(
  status: ContributorDraftItem["status"],
): { chip: DraftChipStatus; label: string } {
  switch (status) {
    case "approved":
      return { chip: "completed", label: "Approved" };
    case "submitted":
      return { chip: "unlocked", label: "Submitted" };
    case "revision-needed":
      return { chip: "not-passed", label: "Revision needed" };
    case "rejected":
      return { chip: "not-passed", label: "Rejected" };
    default:
      return { chip: "normal", label: "Draft" };
  }
}
