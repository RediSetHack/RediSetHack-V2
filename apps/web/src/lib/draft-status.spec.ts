import { describe, expect, it } from "vitest";

import { draftStatusChip } from "./draft-status";

describe("draftStatusChip", () => {
  it("labels a draft that is not submitted yet", () => {
    expect(draftStatusChip("draft")).toEqual({ chip: "normal", label: "Draft" });
  });

  it("labels a revision that is with the reviewers", () => {
    expect(draftStatusChip("submitted")).toEqual({
      chip: "unlocked",
      label: "Submitted",
    });
  });

  it("labels a revision the reviewers sent back", () => {
    expect(draftStatusChip("revision-needed")).toEqual({
      chip: "not-passed",
      label: "Revision needed",
    });
  });

  it("labels an approved revision", () => {
    expect(draftStatusChip("approved")).toEqual({
      chip: "completed",
      label: "Approved",
    });
  });

  it("labels a rejected revision", () => {
    expect(draftStatusChip("rejected")).toEqual({
      chip: "not-passed",
      label: "Rejected",
    });
  });
});
