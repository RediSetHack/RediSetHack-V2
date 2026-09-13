import { BadgeDefinition } from '../domain/entities.js';
import { BadgeDefinitionNotFoundError } from '../domain/errors.js';
import { BadgeDefinitionRepository } from '../domain/ports.js';

export class GetBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  async execute(id: number): Promise<BadgeDefinition> {
    const badge = await this.repository.findById(id);
    if (!badge) throw new BadgeDefinitionNotFoundError(id);
    return badge;
  }
}
