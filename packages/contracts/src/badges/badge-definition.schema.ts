import { z } from "zod";

export const CumulativeBadgeCriteriaSchema = z.object({
  trigger: z.literal("cumulative"),
  target: z.literal("stage_completions"),
  threshold: z.number().int().positive(),
});
export type CumulativeBadgeCriteria = z.infer<
  typeof CumulativeBadgeCriteriaSchema
>;

export const ActivityBadgeCriteriaSchema = z.object({
  trigger: z.literal("activity"),
  target: z.literal("quest_passes"),
  threshold: z.number().int().positive(),
});
export type ActivityBadgeCriteria = z.infer<typeof ActivityBadgeCriteriaSchema>;

export const CategoryBadgeCriteriaSchema = z.object({
  trigger: z.literal("category"),
  target: z.literal("zone_completion"),
  zoneId: z.number().int().positive(),
});
export type CategoryBadgeCriteria = z.infer<typeof CategoryBadgeCriteriaSchema>;

export const BadgeCriteriaSchema = z.discriminatedUnion("trigger", [
  CumulativeBadgeCriteriaSchema,
  ActivityBadgeCriteriaSchema,
  CategoryBadgeCriteriaSchema,
]);
export type BadgeCriteria = z.infer<typeof BadgeCriteriaSchema>;

export const BadgeDefinitionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  criteria: BadgeCriteriaSchema,
  imageUrl: z.string().nullable(),
});
export type BadgeDefinition = z.infer<typeof BadgeDefinitionSchema>;

export const EarnedBadgeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  criteria: BadgeCriteriaSchema,
  imageUrl: z.string().nullable(),
  count: z.number().int().positive(),
  awardedAt: z.array(z.string()),
});
export type EarnedBadge = z.infer<typeof EarnedBadgeSchema>;
