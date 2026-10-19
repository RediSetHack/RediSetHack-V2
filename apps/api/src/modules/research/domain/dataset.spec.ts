import { describe, expect, it } from "vitest";

import { buildDataset } from "./dataset.js";
import type { InteractionRecord } from "./ports/interaction-source.repository.js";

const KEY = "k".repeat(32);
const records: InteractionRecord[] = Array.from({ length: 200 }, (_, i) => ({
  id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
  learnerId: `user_secret_${i % 40}`,
  activityType: i % 5 === 0 ? "reading" : "coding",
  activityId: i % 7,
  occurredAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
  elapsedMs: i % 9 === 0 ? null : 1000,
  elapsedDefinition: "test",
  contentVersion: "1",
  skills: ["loops"],
  difficulty: i % 3 === 0 ? null : "beginner",
  correctness: i % 5 === 0 ? null : i % 2 === 0,
  outcome: { status: "passed", assessed: i % 5 !== 0, code: "print(1)" },
  errors: i % 4 === 0 ? [{ category: "compile" }] : null,
  hints: null,
}));
const learnerQuery = { strategy: "learner", limit: 10000, seed: "v1" } as const;

describe("buildDataset", () => {
  it("is deterministic", () => {
    const a = buildDataset(records, learnerQuery, KEY, 0);
    const b = buildDataset(records, learnerQuery, KEY, 0, new Date(0));
    expect(b.rows).toEqual(a.rows);
    expect(b.manifest.datasetId).toBe(a.manifest.datasetId);
  });

  it("keeps each learner in exactly one split under the learner strategy", () => {
    const { report } = buildDataset(records, learnerQuery, KEY, 0);
    expect(report.learnersInMultipleSplits).toBe(0);
    expect(report.counts.train.rows + report.counts.validation.rows + report.counts.test.rows).toBe(200);
    expect(report.counts.train.rows).toBeGreaterThan(0);
  });

  it("separates splits chronologically under the time strategy", () => {
    const { report } = buildDataset(records, { ...learnerQuery, strategy: "time" }, KEY, 0);
    expect(report.chronologicallySeparated).toBe(true);
    expect(report.counts.test.rows).toBeGreaterThan(0);
  });

  it("emits no direct identifiers or raw payloads, and keeps missing values as null", () => {
    const { rows, report } = buildDataset(records, learnerQuery, KEY, 0);
    const text = JSON.stringify(rows);
    expect(text).not.toContain("user_secret");
    expect(text).not.toContain("print(1)");
    expect(rows.some((r) => r.elapsedMs === null)).toBe(true);
    expect(report.missingValues.elapsedMs).toBe(rows.filter((r) => r.elapsedMs === null).length);
  });

  it("changes pseudonyms with the key and reports truncation", () => {
    const a = buildDataset(records, learnerQuery, KEY, 0);
    expect(buildDataset(records, learnerQuery, "z".repeat(32), 0).rows[0]!.learnerId).not.toBe(a.rows[0]!.learnerId);
    const cut = buildDataset(records, { ...learnerQuery, limit: 50 }, KEY, 0);
    expect(cut.rows).toHaveLength(50);
    expect(cut.report.exclusions.truncatedByLimit).toBe(true);
  });
});
