// Barrel re-export for `@repo/contracts`.
//
// Per-domain schemas are added under `src/<domain>/` (mirroring the API's
// module structure: auth/, content/, progress/, badges/) as each feature
// slice needs them — see the package README and ADR 0004. Each domain adds
// its own re-export line here as it lands; none are added speculatively.
export * from "./badges/index.js";
export * from "./constants/index.js";
export * from "./content/index.js";
export * from "./daily-event/index.js";
export * from "./leaderboard/index.js";
export * from "./profile/index.js";
export * from "./progress/index.js";
export * from "./quest/index.js";
