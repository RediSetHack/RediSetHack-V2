# Leaderboard ranks by XP, ties broken by user id, zero-XP learners unlisted

`GET /v1/api/leaderboard` returns a page of ranked entries plus `me`, the caller's own `{ rank, totalXp, level }` (or `null`), so the YOUR RANK pin shows the real rank on every page.

- **Order**: `total_xp DESC, id ASC`. Ties get distinct, stable ranks (1, 2, 3, 4), never shared ones. The page query and the rank lookup (`findLeaderboardStanding`) must keep this order in step. They are separate statements without a shared snapshot, so XP awarded mid-request can leave `me.rank` one off the table for that response; the next fetch heals it. `users_total_xp_id_index` on `(total_xp DESC, id)` backs both statements.
- **Rank**: the row's position, i.e. 1 + the number of learners ahead under that order.
- **Zero XP**: learners with no XP are not on the leaderboard. They are excluded from `entries` and `total`, and their `me` is `null`, so the pin is hidden.
