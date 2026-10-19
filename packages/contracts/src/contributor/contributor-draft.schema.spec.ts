import { describe, expect, it } from "vitest";
import { ContributorDraftStatusSchema, ReviewDecisionInputSchema } from "./contributor-draft.schema.js";

describe("contributor moderation contracts", () => {
  it("accepts review decisions with a reason and rejects blank reasons", () => {
    expect(ReviewDecisionInputSchema.parse({ decision: "approved", reason: "Ready for learners." })).toEqual({ decision: "approved", reason: "Ready for learners." });
    expect(ReviewDecisionInputSchema.safeParse({ decision: "approved", reason: "  " }).success).toBe(false);
    expect(ReviewDecisionInputSchema.safeParse({ decision: "published", reason: "Ready." }).success).toBe(false);
  });

  it("describes the full contributor draft lifecycle", () => {
    expect(ContributorDraftStatusSchema.options).toEqual(["draft", "submitted", "revision-needed", "approved", "rejected"]);
  });
});
