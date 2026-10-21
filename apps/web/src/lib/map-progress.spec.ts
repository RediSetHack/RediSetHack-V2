import { describe, it, expect } from "vitest";
import { completionSummary, countCompleted, isZoneCleared } from "@/lib/map-progress";

const stage = (status: string) => ({ status });

describe("countCompleted", () => {
  it("counts only completed stages", () => {
    expect(countCompleted([stage("completed"), stage("available"), stage("locked")])).toBe(1);
  });

  it("returns 0 for an empty zone", () => {
    expect(countCompleted([])).toBe(0);
  });
});

describe("isZoneCleared", () => {
  it("is true only when every stage is completed", () => {
    expect(isZoneCleared([stage("completed"), stage("completed")])).toBe(true);
  });

  it("is false when any stage is not completed", () => {
    expect(isZoneCleared([stage("completed"), stage("available")])).toBe(false);
  });

  it("is false for an empty zone", () => {
    expect(isZoneCleared([])).toBe(false);
  });
});

describe("completionSummary", () => {
  it("aggregates totals and percent across zones", () => {
    expect(
      completionSummary([
        [stage("completed"), stage("available")],
        [stage("completed"), stage("completed")],
      ]),
    ).toEqual({ total: 4, completed: 3, percent: 75 });
  });

  it("reports zero percent when there are no stages", () => {
    expect(completionSummary([[], []])).toEqual({ total: 0, completed: 0, percent: 0 });
  });
});
