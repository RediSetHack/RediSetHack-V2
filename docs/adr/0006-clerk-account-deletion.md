# Clerk account deletion is terminal locally

Clerk `user.deleted` webhooks are verified with the existing Svix raw-body signature and delete the corresponding `users` row. PostgreSQL cascades remove the learner's Results, Quest Sessions, XP awards, Badge awards, and Stage completions; removing the user row also removes the learner from profile and leaderboard queries. Content and other learners' records remain unchanged.

The `deleted_users` table retains only the immutable Clerk ID. It has no foreign key and is excluded from learner, contributor, and research data queries. This marker is permanent: every later `user.created` or `user.updated` event for that ID is acknowledged but ignored, regardless of delivery order or replay. Upserts and deletion take the same per-ID transaction advisory lock, so a concurrent stale sync cannot race the deletion and restore the row. A deleted account's authenticated sync request returns 401.

Clerk IDs are immutable and never reused, so no event timestamp comparison or marker expiry is needed. Reinstatement requires a new Clerk identity. Repeated deletion events are safe and leave the same marker.
