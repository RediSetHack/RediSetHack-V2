# Learning streaks are derived from persisted accomplishments

Status: Accepted

## Decision

A **Learning Day** is an Asia/Manila calendar day (UTC+8, no DST) on which the learner has at least one **qualifying accomplishment**: a persisted `learning_interactions` row (#130) that is a completed Reading, a submitted-and-passed Quest, or a passed/solved/completed Coding, CTF or Side Quest outcome. Logins, page views, transport replays (the interaction's `session_id` is unique), failed or expired attempts and wrong flags never qualify. Reading is counted separately from assessed activity (everything else) so the two are never conflated.

Streaks and contribution counts are computed at read time from `occurred_at`; nothing is stored, so there is no rollover job and a request's wall-clock time only decides what "today" is. A day's value never changes once it has passed, except by backfilled history, which counts on the day it actually occurred.

- **Longest streak**: longest run of consecutive Learning Days across the learner's whole history.
- **Current streak**: run of consecutive Learning Days ending today, or ending yesterday while today has no accomplishment yet. It becomes 0 once a whole Asia/Manila day passes empty.
- **Range**: `GET /v1/api/users/learning-streak?from&to` returns a dense, bounded (max 366 days, default 365) list of daily counts. A malformed, inverted, oversized or future range is rejected with 400. Streak values do not depend on the requested range.

## Consequences

- Retroactive corrections (a late-persisted event) can lengthen or merge past streaks; this is intended.
- Wider "accomplishment" definitions only require changing the qualifying predicate in `DrizzleProfileRepository.findDailyLearningActivity`.
