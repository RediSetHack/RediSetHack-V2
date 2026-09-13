import { BadgeDefinitionNotFoundError } from '../domain/errors.js';
import { BadgeDefinitionRepository } from '../domain/ports.js';

export class DeleteBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new BadgeDefinitionNotFoundError(id);
  }
}
