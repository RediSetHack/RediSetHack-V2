import { describe, expect, it } from "vitest";

import { calculateLevel } from "./domain/level-calculator.js";

describe("calculateLevel", () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [399, 2],
    [400, 3],
    [899, 3],
    [900, 4],
  ])("returns level %i's threshold correctly for %i xp -> level %i", (xp, level) => {
    expect(calculateLevel(xp)).toBe(level);
  });

  it("clamps negative xp to level 1", () => {
    expect(calculateLevel(-50)).toBe(1);
  });
});
