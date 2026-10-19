# Research dataset export is admin-only, pseudonymous and reproducible

`GET /v1/api/admin/research/dataset` (Clerk admins only) exports `learning_interactions` as a **Research Dataset**: rows, a manifest, and a quality report.

- **Access**: the existing `ClerkAuthGuard` + `AdminGuard`. The route returns 503 unless `RESEARCH_PSEUDONYM_KEY` (at least 32 characters) is set, so exports cannot run without a key.
- **Eligibility**: events of learners that still exist and have no `deleted_users` marker. Account deletion cascades the events away (ADR 0006); the marker filter is a second guard and `exclusions.deletedLearnerRows` reports any it caught. There is no consent flag yet: the project-approved research/privacy protocol must define one before an export is used as thesis evidence, and the eligibility query is the single place to add it.
- **Retention**: events are retained for the life of the learner's account and are not expired by age. Withdrawal is account deletion, the only supported mechanism. Exports are point-in-time copies: researchers must discard earlier exports and re-export after deletions to honor them, and key rotation intentionally unlinks old exports. This is the implemented default pending the approved research protocol.
- **Pseudonyms**: learner and event ids are `HMAC-SHA256(key, scope:id)` truncated to 128 bits. Rotating the key unlinks every export from earlier ones. Email, name and Clerk ids are never selected.
- **Lineage**: each row carries a pseudonymous `sessionId` (the attempt/session the event came from, `null` when absent), activity, skills, difficulty and content version.
- **Fields**: only derived fields are projected (correctness, status, error categories, hint count, skills, difficulty, content version, timing). Raw `answers` and `outcome` payloads are not copied; coding attempts keep code on their owner-scoped row, never in the dataset.
- **Missing values**: always `null`, never defaulted; the report counts nulls per field.
- **Splits** (70/15/15): `learner` hashes the pseudonym with a seed so a learner lives in exactly one split; `time` cuts at event timestamps so every train event precedes every validation event, which precede every test event (learners may span splits, and the report says how many). Equal timestamps never straddle a cut, so a window can be small or empty when few distinct timestamps exist; the report counts show it. The `seed` applies to `learner` only. Split assignment uses the keyed pseudonym, so a stable key is required for reproducibility.
- **Reproducibility**: rows are ordered by `(occurred_at, id)`; `datasetId` is a content hash of the query and rows (`generatedAt` is excluded). Output is bounded by `limit` (max 50000); `truncatedByLimit` reports a cut and `truncatedAfter` gives the last included timestamp: the oldest events are kept, so a truncated export is a prefix of history, not a sample.

Sanitized fixtures exercise the pipeline only; they are not thesis evidence.
