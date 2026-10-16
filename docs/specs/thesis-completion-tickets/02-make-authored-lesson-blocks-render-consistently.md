# Thesis 02: Make authored Lesson blocks render consistently

Published: https://github.com/RediSetHack/RediSetHack-V2/issues/119

Status: ready-for-agent. Approved on 2026-10-15.

## Parent

https://github.com/RediSetHack/RediSetHack-V2/issues/117

## What to build

An author supplies text, code, image, and exercise blocks through the content API and learners can read them and open exercise starter code in Codelab.

## Acceptance criteria

- [ ] Define one compatible authoring/response/rendering format; migrate legacy code fields and preserve image material rather than dropping it.
- [ ] Validate malformed known blocks; keep an explicit readable fallback only for genuinely unknown future block types.
- [ ] Update the existing Lesson renderer and client contracts, including accessible image descriptions and keyboard-operable exercise actions.
- [ ] Prove author → PostgreSQL → learner response for every supported block and verify the existing web normalization boundary.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

None (can start immediately).

## Further notes

Traceability: G2; Novel-Based Learning and Interactive Programming.
