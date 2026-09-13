import { ZoneNotFoundError } from '../domain/errors.js';
import { ZoneRepository } from '../domain/ports.js';

export class DeleteZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new ZoneNotFoundError(id);
  }
}
