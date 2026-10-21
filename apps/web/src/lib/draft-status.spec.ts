import { describe, expect, it } from "vitest";

import { draftStatusChip } from "./draft-status";

const STATUS_CASES = [
  { status: "draft", chip: "normal", label: "Draft" },
  { status: "submitted", chip: "unlocked", label: "Submitted" },
  { status: "revision-needed", chip: "not-passed", label: "Revision needed" },
  { status: "approved", chip: "completed", label: "Approved" },
  { status: "rejected", chip: "not-passed", label: "Rejected" },
] as const;

describe("draftStatusChip", () => {
  it.each(STATUS_CASES)(
    "labels a $status draft as $label",
    ({ status, chip, label }) => {
      expect(draftStatusChip(status)).toEqual({ chip, label });
    },
  );
});
