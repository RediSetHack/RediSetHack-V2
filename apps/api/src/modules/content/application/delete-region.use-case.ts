import { RegionNotFoundError } from '../domain/errors.js';
import { RegionRepository } from '../domain/ports.js';

export class DeleteRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new RegionNotFoundError(id);
  }
}
