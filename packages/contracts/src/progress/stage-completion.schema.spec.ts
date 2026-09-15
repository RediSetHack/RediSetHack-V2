import { describe, expect, it } from "vitest";
import { StageCompletionResponseSchema } from "./stage-completion.schema.js";

describe("StageCompletionResponseSchema", () => {
  it("parses a completion with no level-up or badges", () => {
    const payload = {
      stageId: 1,
      xpEarned: 50,
      eventMultiplier: 1,
      eventType: "normal" as const,
      level: 2,
      leveledUp: false,
      badgesEarned: [],
      nextStageId: 2,
    };

    expect(StageCompletionResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses a bonus-event completion that levels up and earns badges", () => {
    const payload = {
      stageId: 5,
      xpEarned: 100,
      eventMultiplier: 2,
      eventType: "bonus" as const,
      level: 3,
      leveledUp: true,
      badgesEarned: [
        {
          badgeDefinitionId: 1,
          name: "Consistent Learner",
          slug: "consistent-learner",
          imageUrl: null,
          awardCount: 2,
        },
      ],
      nextStageId: 6,
    };

    expect(StageCompletionResponseSchema.parse(payload)).toEqual(payload);
  });

  it("parses a null nextStageId for the last Stage in a Zone", () => {
    const payload = {
      stageId: 9,
      xpEarned: 20,
      eventMultiplier: 1,
      eventType: "normal" as const,
      level: 1,
      leveledUp: false,
      badgesEarned: [],
      nextStageId: null,
    };

    expect(StageCompletionResponseSchema.parse(payload)).toEqual(payload);
  });

  it("rejects a payload missing badgesEarned", () => {
    expect(() =>
      StageCompletionResponseSchema.parse({
        stageId: 1,
        xpEarned: 10,
        eventMultiplier: 1,
        eventType: "normal",
        level: 1,
        leveledUp: false,
        nextStageId: null,
      }),
    ).toThrow();
  });
});
