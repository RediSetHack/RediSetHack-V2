# Novel journeys reuse the learning catalog

Status: Accepted

## Decision

Represent a Novel with a Region that has a non-null `story_intro`; its name is the Novel title. A Zone inside that Region is a chapter, and its Stages are ordered learning encounters. Existing Region, Zone, and Stage identifiers, routes, catalog data, and `user_progress` records stay in place. A learner's completed position remains the existing Stage Completion record; the first available Stage is the resume position. Regions without a story introduction retain their existing meaning and presentation.

Novel access remains independent of Character selection. The first sample Novel is ordinary learner catalog content and uses the existing authenticated Stage lessons and completion flow.

## Consequences

- Story context needs only nullable Region metadata; it does not require parallel Novel or chapter tables.
- Completion and resume behavior use the established server-computed Stage statuses, preserving existing evidence.
- Admin Region CRUD can set the story introduction; learner discovery remains the existing catalog API.
