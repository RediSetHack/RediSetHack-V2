import { z } from "zod";
import { CompetencySchema, DifficultySchema } from "./competency.schema.js";
import { StageStatusSchema } from "./stage.schema.js";

/**
 * A single discoverable catalog item, returned by `GET /v1/api/discover`.
 *
 * Discovery is a flattened, read-only view of the approved catalog: Regions
 * (Novels), Zones (chapters), and Stages (learning activities). Only
 * safe, public metadata is ever returned — lesson content, questions, and
 * other restricted bodies are never part of discovery.
 */
export const DiscoveryItemKindSchema = z.enum(["region", "zone", "stage"]);
export type DiscoveryItemKind = z.infer<typeof DiscoveryItemKindSchema>;

export const DiscoveryItemSchema = z.object({
  kind: DiscoveryItemKindSchema,
  id: z.number().int().positive(),
  title: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  // Hierarchy context (present on zones and stages).
  regionId: z.number().int().positive().optional(),
  regionName: z.string().nullable().optional(),
  zoneId: z.number().int().positive().optional(),
  zoneName: z.string().nullable().optional(),
  // Stage-only learning metadata.
  competencies: z.array(CompetencySchema).optional(),
  difficulty: DifficultySchema.nullable().optional(),
  xpReward: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
  // Stage-only progression status; absent for regions and zones.
  status: StageStatusSchema.optional(),
  lockReason: z.string().nullable().optional(),
  // Region-only story introduction (designates a Novel).
  storyIntro: z.string().nullable().optional(),
});
export type DiscoveryItem = z.infer<typeof DiscoveryItemSchema>;

/** The discovery listing, `GET /v1/api/discover`. Results are bounded. */
export const DiscoveryResponseSchema = z.array(DiscoveryItemSchema);
export type DiscoveryResponse = z.infer<typeof DiscoveryResponseSchema>;

export const DISCOVERY_DEFAULT_LIMIT = 50;
export const DISCOVERY_MAX_LIMIT = 100;
