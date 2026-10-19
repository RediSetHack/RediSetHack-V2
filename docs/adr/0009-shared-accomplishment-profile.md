# Shared profiles are an opt-in allowlist behind a revocable token

Status: Accepted

## Decision

`users.share_token` (nullable uuid, unique) is the only sharing state. Null means private (the default). Enabling sharing issues a random token (kept if already present, so the link is stable); disabling nulls it, so the old link immediately returns 404 and a later re-enable yields a new link. The token is unrelated to the user id.

`GET /v1/api/shared-profiles/:shareId` is unauthenticated and returns an explicit allowlist (`SharedProfileResponseSchema`): Adventurer Rank, XP, Character name/slug/image, Badges with counts, completed Novel / Side Quest / CTF counts, and current/longest streak. It never includes the user id, name, email, activity log, code, conversations, baseline or contribution calendar. Unknown, malformed and revoked ids are all 404.

Adventurer Rank is `level` (the existing formula), exposed as an additional field. Evidence counts come from completion records (`user_progress`, `ctf_solves`, `side_quest_completions`), so content retirement (ADR 0005) never lowers them; a retired Novel counts only if every Stage in it was completed.
