import { BadgeDefinition } from '../domain/entities.js';
import {
  BadgeDefinitionNotFoundError,
  ParentZoneNotFoundError,
} from '../domain/errors.js';
import { BadgeDefinitionRepository, ZoneRepository } from '../domain/ports.js';
import type { CreateBadgeDefinitionInput } from './create-badge-definition.use-case.js';

export type UpdateBadgeDefinitionInput = Partial<CreateBadgeDefinitionInput>;

export class UpdateBadgeDefinitionUseCase {
  constructor(
    private readonly repository: BadgeDefinitionRepository,
    private readonly zones: ZoneRepository,
  ) {}

  async execute(
    id: number,
    input: UpdateBadgeDefinitionInput,
  ): Promise<BadgeDefinition> {
    if (input.criteria?.trigger === 'category') {
      const zone = await this.zones.findById(input.criteria.zoneId);
      if (!zone) throw new ParentZoneNotFoundError(input.criteria.zoneId);
    }
    const updated = await this.repository.update(id, input);
    if (!updated) throw new BadgeDefinitionNotFoundError(id);
    return updated;
  }
}
