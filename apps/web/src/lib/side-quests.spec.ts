import { describe, expect, it } from "vitest";

import { requirementStateLabel, sideQuestStatusChip } from "./side-quests";

const STATUS_CASES = [
  { status: "locked", chip: "locked", label: "Locked" },
  { status: "available", chip: "unlocked", label: "Unlocked" },
  { status: "in_progress", chip: "unlocked", label: "In progress" },
  { status: "completed", chip: "completed", label: "Completed" },
] as const;

describe("sideQuestStatusChip", () => {
  it.each(STATUS_CASES)(
    "labels a $status Side Quest as $label",
    ({ status, chip, label }) => {
      expect(sideQuestStatusChip(status)).toEqual({ chip, label });
    },
  );
});

describe("requirementStateLabel", () => {
  it("states a met requirement in text", () => {
    expect(requirementStateLabel(true)).toBe("Requirement met");
  });

  it("states an unmet requirement in text", () => {
    expect(requirementStateLabel(false)).toBe("Requirement not met");
  });
});
