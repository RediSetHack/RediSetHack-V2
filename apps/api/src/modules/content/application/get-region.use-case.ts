import { Region } from '../domain/entities.js';
import { RegionNotFoundError } from '../domain/errors.js';
import { RegionRepository } from '../domain/ports.js';

export class GetRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  async execute(id: number): Promise<Region> {
    const region = await this.repository.findById(id);
    if (!region) throw new RegionNotFoundError(id);
    return region;
  }
}
