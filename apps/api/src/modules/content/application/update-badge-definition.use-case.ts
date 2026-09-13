import { BadgeDefinition } from '../domain/entities.js';
import { BadgeDefinitionNotFoundError } from '../domain/errors.js';
import { BadgeDefinitionRepository } from '../domain/ports.js';
import type { CreateBadgeDefinitionInput } from './create-badge-definition.use-case.js';

export type UpdateBadgeDefinitionInput = Partial<CreateBadgeDefinitionInput>;

export class UpdateBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  async execute(
    id: number,
    input: UpdateBadgeDefinitionInput,
  ): Promise<BadgeDefinition> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new BadgeDefinitionNotFoundError(id);
    return updated;
  }
}
