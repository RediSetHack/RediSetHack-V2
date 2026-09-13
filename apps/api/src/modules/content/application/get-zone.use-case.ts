import { Zone } from '../domain/entities.js';
import { ZoneNotFoundError } from '../domain/errors.js';
import { ZoneRepository } from '../domain/ports.js';

export class GetZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}
  async execute(id: number): Promise<Zone> {
    const zone = await this.repository.findById(id);
    if (!zone) throw new ZoneNotFoundError(id);
    return zone;
  }
}
