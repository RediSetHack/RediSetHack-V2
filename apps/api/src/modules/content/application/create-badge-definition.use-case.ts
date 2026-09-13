import { BadgeCriteria, BadgeDefinition } from '../domain/entities.js';
import { BadgeDefinitionRepository } from '../domain/ports.js';

export type CreateBadgeDefinitionInput = {
  name: string;
  slug: string;
  description?: string | null;
  criteria: BadgeCriteria;
  imageUrl?: string | null;
};

export class CreateBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  execute(input: CreateBadgeDefinitionInput): Promise<BadgeDefinition> {
    return this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      criteria: input.criteria,
      imageUrl: input.imageUrl ?? null,
    });
  }
}
