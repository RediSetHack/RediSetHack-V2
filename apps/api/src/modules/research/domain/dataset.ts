import { createHash, createHmac } from "node:crypto";
import type { DatasetExport, DatasetExportQuery, DatasetReport, DatasetRow, DatasetSplit } from "@repo/contracts";

import type { InteractionRecord } from "./ports/interaction-source.repository.js";

const SPLITS: DatasetSplit[] = ["train", "validation", "test"];
const TRAIN_FRACTION = 0.7;
const VALIDATION_FRACTION = 0.15;

const pseudonym = (key: string, scope: string, value: string) => createHmac("sha256", key).update(`${scope}:${value}`).digest("hex").slice(0, 32);
const unit = (key: string, scope: string, value: string) => parseInt(pseudonym(key, scope, value).slice(0, 8), 16) / 2 ** 32;
const bucket = (fraction: number): DatasetSplit => (fraction < TRAIN_FRACTION ? "train" : fraction < TRAIN_FRACTION + VALIDATION_FRACTION ? "validation" : "test");

const asObject = (value: unknown): Record<string, unknown> => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});

/** Projects a stored event to research fields only: raw answers and outcome payloads are never copied through. */
function project(record: InteractionRecord, key: string): Omit<DatasetRow, "split"> {
  const outcome = asObject(record.outcome);
  return {
    eventId: pseudonym(key, "event", record.id),
    learnerId: pseudonym(key, "learner", record.learnerId),
    sessionId: record.sessionId === null ? null : pseudonym(key, "session", record.sessionId),
    activityType: record.activityType,
    activityId: record.activityId,
    skills: record.skills,
    difficulty: record.difficulty,
    contentVersion: record.contentVersion,
    occurredAt: record.occurredAt.toISOString(),
    elapsedMs: record.elapsedMs,
    elapsedDefinition: record.elapsedDefinition,
    assessed: typeof outcome.assessed === "boolean" ? outcome.assessed : null,
    correctness: record.correctness,
    status: typeof outcome.status === "string" ? outcome.status : null,
    errorCategories: Array.isArray(record.errors) ? record.errors.map((e) => asObject(e).category).filter((c): c is string => typeof c === "string") : [],
    hintCount: Array.isArray(record.hints) ? record.hints.length : null,
  };
}

function assignSplits(rows: Omit<DatasetRow, "split">[], records: InteractionRecord[], query: DatasetExportQuery, key: string): DatasetSplit[] {
  if (query.strategy === "learner") return records.map((r) => bucket(unit(key, `split:${query.seed}`, r.learnerId)));
  // Time-aware: cut at event timestamps so equal timestamps can never straddle a boundary.
  const times = rows.map((r) => r.occurredAt);
  const from = (fraction: number) => Math.min(times.length - 1, Math.floor(times.length * fraction));
  const trainEnd = times[from(TRAIN_FRACTION)] ?? "";
  // Skip ties with trainEnd so a run of equal timestamps cannot make the validation window empty; if none remain, validation takes the rest.
  const validationEnd = times.slice(from(TRAIN_FRACTION + VALIDATION_FRACTION)).find((t) => t > trainEnd) ?? "\uffff";
  return rows.map((r) => (r.occurredAt < trainEnd ? "train" : r.occurredAt < validationEnd ? "validation" : "test"));
}

function report(rows: DatasetRow[], deletedLearnerRows: number, truncatedAfter: string | null): DatasetReport {
  const counts = Object.fromEntries(SPLITS.map((s) => {
    const part = rows.filter((r) => r.split === s);
    return [s, {
      rows: part.length,
      learners: new Set(part.map((r) => r.learnerId)).size,
      correct: part.filter((r) => r.correctness === true).length,
      incorrect: part.filter((r) => r.correctness === false).length,
      unlabeled: part.filter((r) => r.correctness === null).length,
    }];
  })) as DatasetReport["counts"];

  const splitsByLearner = new Map<string, Set<DatasetSplit>>();
  for (const r of rows) splitsByLearner.set(r.learnerId, (splitsByLearner.get(r.learnerId) ?? new Set()).add(r.split));

  const extent = (s: DatasetSplit) => {
    const times = rows.filter((r) => r.split === s).map((r) => r.occurredAt).sort();
    return { first: times[0], last: times[times.length - 1] };
  };
  const [train, validation, test] = SPLITS.map(extent) as [ReturnType<typeof extent>, ReturnType<typeof extent>, ReturnType<typeof extent>];
  const before = (a: { last?: string }, b: { first?: string }) => a.last === undefined || b.first === undefined || a.last < b.first;

  const missing = (field: keyof DatasetRow) => rows.filter((r) => r[field] === null).length;
  return {
    counts,
    learnersInMultipleSplits: [...splitsByLearner.values()].filter((s) => s.size > 1).length,
    chronologicallySeparated: before(train, validation) && before(validation, test) && before(train, test),
    missingValues: Object.fromEntries((["difficulty", "elapsedMs", "assessed", "correctness", "status", "hintCount"] as const).map((f) => [f, missing(f)])),
    exclusions: { deletedLearnerRows, truncatedByLimit: truncatedAfter !== null, truncatedAfter },
  };
}

/** Pure and deterministic: the same records, query and key always produce the same `datasetId`, rows and report. */
export function buildDataset(source: InteractionRecord[], query: DatasetExportQuery, key: string, deletedLearnerRows: number, now = new Date()): DatasetExport {
  const truncated = source.length > query.limit;
  const records = source.slice(0, query.limit);
  const projected = records.map((r) => project(r, key));
  const splits = assignSplits(projected, records, query, key);
  const rows: DatasetRow[] = projected.map((r, i) => ({ ...r, split: splits[i]! }));
  // `seed` only drives the learner strategy, so it must not change the identity of a time-split dataset.
  const identity = { ...query, seed: query.strategy === "learner" ? query.seed : null };
  return {
    manifest: {
      schemaVersion: 1,
      datasetId: createHash("sha256").update(JSON.stringify([identity, rows])).digest("hex").slice(0, 16),
      strategy: query.strategy,
      seed: query.seed,
      limit: query.limit,
      generatedAt: now.toISOString(),
    },
    report: report(rows, deletedLearnerRows, truncated ? (rows[rows.length - 1]?.occurredAt ?? null) : null),
    rows,
  };
}
