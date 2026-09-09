# Badge multiplicity — GitHub-style repeat awards

Badges can be earned multiple times, following a GitHub-style achievement model where repeat awards increment a count (e.g. "×3") rather than being silently ignored. This departs from the typical unique-badge model where each badge is either earned or not. The legacy system treated badges as unique unlocks but had no duplicate-checking code, meaning the intended uniqueness was accidental rather than enforced. The user chose multiplicative badges to reward sustained engagement.

Different badges use different trigger types: cumulative milestones (e.g. "Complete 5 stages"), category milestones (e.g. "Complete all stages in a Zone"), and activity-based milestones (e.g. "Pass 10 Quests"). Badge criteria — trigger type, threshold, and target — are defined as data, not hardcoded to stage numbers.

This decision affects schema design: badge awards must be separate records or carry a count, and badge criteria must be a configurable data structure rather than application code.
