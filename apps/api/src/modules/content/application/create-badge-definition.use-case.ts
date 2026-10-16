import { BadgeCriteria, BadgeDefinition } from '../domain/entities.js';
import { ParentZoneNotFoundError } from '../domain/errors.js';
import { BadgeDefinitionRepository, ZoneRepository } from '../domain/ports.js';

export type CreateBadgeDefinitionInput = {
  name: string;
  slug: string;
  description?: string | null;
  criteria: BadgeCriteria;
  imageUrl?: string | null;
};

export class CreateBadgeDefinitionUseCase {
  constructor(
    private readonly repository: BadgeDefinitionRepository,
    private readonly zones: ZoneRepository,
  ) {}

  async execute(input: CreateBadgeDefinitionInput): Promise<BadgeDefinition> {
    if (input.criteria.trigger === 'category') {
      const zone = await this.zones.findById(input.criteria.zoneId);
      if (!zone) throw new ParentZoneNotFoundError(input.criteria.zoneId);
    }

    return this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      criteria: input.criteria,
      imageUrl: input.imageUrl ?? null,
    });
  }
}
