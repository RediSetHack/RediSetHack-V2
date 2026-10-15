# T19: Show meaningful learning days, streaks, and contributions

Draft for review; not yet published. Intended label after approval: `ready-for-agent`.

## Parent

RediSetHack thesis completion specification (GitHub issue to be created after review).

## What to build

Learners see current/longest streaks and a calendar contribution history derived from qualifying persisted learning accomplishments.

## Acceptance criteria

- [ ] Record the qualifying-event policy using Asia/Manila days; exclude raw login/page views and transport replays, and distinguish reading from assessed activity.
- [ ] Aggregate a bounded date range with daily counts and current/longest streaks; define day rollover, zero activity, and backfilled-history behavior.
- [ ] Show accessible text summaries with the contribution graph in the profile so color alone does not communicate activity.
- [ ] Verify midnight boundaries, duplicates, gaps, future-date rejection, and the same learner history across different request times.
- [ ] Keep the slice demonstrable through its actual learner/contributor interface or existing administration/research operation; update affected contracts and use the approved behavioral test boundaries.

## Blocked by

T13: Record trustworthy learning interactions

## Further notes

Traceability: Learning Streak System; Learning Contribution Graph.
