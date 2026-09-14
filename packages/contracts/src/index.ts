// Barrel re-export for `@repo/contracts`.
//
// Per-domain schemas are added under `src/<domain>/` (mirroring the API's
// module structure: auth/, content/, progress/, badges/) as each feature
// slice needs them — see the package README and ADR 0004. Each domain adds
// its own re-export line here as it lands; none are added speculatively.
export * from "./constants/index.js";
