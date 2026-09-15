import { z } from "zod";

/** A single Character, as returned by `CharacterPresenter` in `apps/api`. */
export const CharacterSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
});
export type Character = z.infer<typeof CharacterSchema>;

/** The public Character catalog listing, `GET /v1/api/characters`. */
export const CharacterListResponseSchema = z.array(CharacterSchema);
export type CharacterListResponse = z.infer<typeof CharacterListResponseSchema>;
