import { z } from "zod";

/** Evidence counts derived from persisted completions; they survive content retirement (ADR 0005). */
export const AccomplishmentCountsSchema = z.object({
  novelsCompleted: z.number().int().nonnegative(),
  sideQuestsCompleted: z.number().int().nonnegative(),
  ctfsSolved: z.number().int().nonnegative(),
});
export type AccomplishmentCounts = z.infer<typeof AccomplishmentCountsSchema>;

/** Sharing is off by default (`shareId: null`). The share id is the only public handle; revoking discards it. */
export const ProfileSharingSchema = z.object({ shareId: z.string().uuid().nullable() });
export type ProfileSharing = z.infer<typeof ProfileSharingSchema>;

export const SetProfileSharingRequestSchema = z.object({ enabled: z.boolean() });
export type SetProfileSharingRequest = z.infer<typeof SetProfileSharingRequestSchema>;
