import { describe, expect, it } from "vitest";

import { buildDataset } from "./dataset.js";
import type { InteractionRecord } from "./ports/interaction-source.repository.js";

const KEY = "k".repeat(32);
const records: InteractionRecord[] = Array.from({ length: 200 }, (_, i) => ({
  id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
  learnerId: `user_secret_${i % 40}`,
  sessionId: i % 6 === 0 ? null : `coding:attempt-secret-${i}`,
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
    expect(text).not.toContain("attempt-secret");
    expect(rows.filter((r) => r.sessionId === null)).toHaveLength(records.filter((r) => r.sessionId === null).length);
    expect(new Set(rows.filter((r) => r.sessionId).map((r) => r.sessionId)).size).toBe(records.filter((r) => r.sessionId).length);
    expect(rows.some((r) => r.elapsedMs === null)).toBe(true);
    expect(report.missingValues.elapsedMs).toBe(rows.filter((r) => r.elapsedMs === null).length);
  });

  it("changes pseudonyms with the key and reports truncation", () => {
    const a = buildDataset(records, learnerQuery, KEY, 0);
    expect(buildDataset(records, learnerQuery, "z".repeat(32), 0).rows[0]!.learnerId).not.toBe(a.rows[0]!.learnerId);
    const cut = buildDataset(records, { ...learnerQuery, limit: 50 }, KEY, 0);
    expect(cut.rows).toHaveLength(50);
    expect(cut.report.exclusions.truncatedByLimit).toBe(true);
    expect(cut.report.exclusions.truncatedAfter).toBe(cut.rows[49]!.occurredAt);
    expect(buildDataset(records, learnerQuery, KEY, 0).report.exclusions.truncatedAfter).toBeNull();
  });

  it("keeps all three time windows populated when events share timestamps", () => {
    const tied = records.map((r, i) => ({ ...r, occurredAt: new Date(Date.UTC(2026, 0, 1, 0, 0, Math.floor(i / 5))) }));
    const { report } = buildDataset(tied, { ...learnerQuery, strategy: "time" }, KEY, 0);
    expect(report.chronologicallySeparated).toBe(true);
    expect(report.counts.train.rows).toBeGreaterThan(0);
    expect(report.counts.validation.rows).toBeGreaterThan(0);
    expect(report.counts.test.rows).toBeGreaterThan(0);
  });

  it("ignores the seed for the identity of a time-split dataset", () => {
    const time = { ...learnerQuery, strategy: "time" } as const;
    expect(buildDataset(records, { ...time, seed: "other" }, KEY, 0).manifest.datasetId).toBe(buildDataset(records, time, KEY, 0).manifest.datasetId);
    expect(buildDataset(records, { ...learnerQuery, seed: "other" }, KEY, 0).manifest.datasetId).not.toBe(buildDataset(records, learnerQuery, KEY, 0).manifest.datasetId);
  });
});
