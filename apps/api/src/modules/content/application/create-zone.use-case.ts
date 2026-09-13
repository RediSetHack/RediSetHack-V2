import { Zone } from '../domain/entities.js';
import { ParentRegionNotFoundError } from '../domain/errors.js';
import { RegionRepository, ZoneRepository } from '../domain/ports.js';

export type CreateZoneInput = {
  regionId: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
};

export class CreateZoneUseCase {
  constructor(
    private readonly repository: ZoneRepository,
    private readonly regions: RegionRepository,
  ) {}
  async execute(input: CreateZoneInput): Promise<Zone> {
    const region = await this.regions.findById(input.regionId);
    if (!region) throw new ParentRegionNotFoundError(input.regionId);
    return this.repository.create({
      regionId: input.regionId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}
