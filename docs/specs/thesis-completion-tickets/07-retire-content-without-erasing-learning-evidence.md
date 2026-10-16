# Thesis 07: Retire content without erasing learning evidence

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/124

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

An administrator retires used content while learners retain their historical Results, earned XP, and accomplishments.

## Acceptance criteria

- [ ] Archive content with history; stop new starts and active catalog discovery without cascading away Results, Stage completions, XP claims, or Badge awards.
- [ ] Keep assessed snapshots reviewable and define what happens to an already-started session when its content is retired.
- [ ] Permit physical removal only for unused content where no required history is lost; keep XP and Badge totals consistent.
- [ ] Exercise retirement after completion and after an in-flight session through API and current review screens with PostgreSQL.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

- #118 — Make authored Quests playable
- #121 — Persist authoritative Quest Sessions and historical Results

## Further notes

Traceability: G10; progression history and content lifecycle.
