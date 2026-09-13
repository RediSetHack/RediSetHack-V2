import { Region } from '../domain/entities.js';
import { RegionRepository } from '../domain/ports.js';

export type CreateRegionInput = {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
};

export class CreateRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  execute(input: CreateRegionInput): Promise<Region> {
    return this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}
