import { Region } from '../domain/entities.js';
import { RegionNotFoundError } from '../domain/errors.js';
import { RegionRepository } from '../domain/ports.js';
import type { CreateRegionInput } from './create-region.use-case.js';

export type UpdateRegionInput = Partial<CreateRegionInput>;

export class UpdateRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  async execute(id: number, input: UpdateRegionInput): Promise<Region> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new RegionNotFoundError(id);
    return updated;
  }
}
