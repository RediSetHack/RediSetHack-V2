import type { UserRole } from "./entities/user.entity.js";

/**
 * Maps Clerk `publicMetadata` to a role. `publicMetadata` is writable only from
 * the Clerk Dashboard/Backend API (never by the user), so it is trusted;
 * `unsafeMetadata` is deliberately ignored. Dashboard-assigned `admin` is kept.
 */
export function roleFromPublicMetadata(metadata: unknown): UserRole {
  const role = metadata != null && typeof metadata === "object" && "role" in metadata ? metadata["role"] : undefined;
  return role === "admin" || role === "contributor" ? role : "user";
}
