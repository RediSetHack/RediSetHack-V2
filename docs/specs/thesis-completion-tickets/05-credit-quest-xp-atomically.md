# T05: Credit Quest XP atomically

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

A passing Quest grants its first-pass XP exactly once and a failed request can be retried without losing the award.

## Acceptance criteria

- [ ] Keep accepted Result, first-pass claim, and XP credit consistent on failure; reuse the Stage transaction convention where applicable.
- [ ] Preserve daily Event multipliers and reward-free passing retakes; badge failures do not erase the accepted Result.
- [ ] Return the persisted credited amount on replay and show it in the current Result/reward interface.
- [ ] Inject failure around claim/credit and race passing sessions against PostgreSQL; prove exactly one correct credit with rollback/recovery.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T04: Persist authoritative Quest Sessions and historical Results

## Further notes

Traceability: G5; Experience Points.
