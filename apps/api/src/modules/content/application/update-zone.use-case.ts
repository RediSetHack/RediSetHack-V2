import { Zone } from '../domain/entities.js';
import { ZoneNotFoundError } from '../domain/errors.js';
import { ZoneRepository } from '../domain/ports.js';
import type { CreateZoneInput } from './create-zone.use-case.js';

export type UpdateZoneInput = Partial<Omit<CreateZoneInput, 'regionId'>>;

export class UpdateZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}
  async execute(id: number, input: UpdateZoneInput): Promise<Zone> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new ZoneNotFoundError(id);
    return updated;
  }
}
