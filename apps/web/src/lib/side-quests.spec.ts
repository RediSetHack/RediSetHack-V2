import { describe, expect, it } from "vitest";

import { requirementStateLabel, sideQuestStatusChip } from "./side-quests";

describe("sideQuestStatusChip", () => {
  it("labels a locked Side Quest", () => {
    expect(sideQuestStatusChip("locked")).toEqual({
      chip: "locked",
      label: "Locked",
    });
  });

  it("labels an available Side Quest as unlocked", () => {
    expect(sideQuestStatusChip("available")).toEqual({
      chip: "unlocked",
      label: "Unlocked",
    });
  });

  it("labels a started Side Quest as in progress, not locked", () => {
    expect(sideQuestStatusChip("in_progress")).toEqual({
      chip: "unlocked",
      label: "In progress",
    });
  });

  it("labels a finished Side Quest as completed", () => {
    expect(sideQuestStatusChip("completed")).toEqual({
      chip: "completed",
      label: "Completed",
    });
  });
});

describe("requirementStateLabel", () => {
  it("states a met requirement in text", () => {
    expect(requirementStateLabel(true)).toBe("Requirement met");
  });

  it("states an unmet requirement in text", () => {
    expect(requirementStateLabel(false)).toBe("Requirement not met");
  });
});
