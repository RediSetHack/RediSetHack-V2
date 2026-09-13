import { Stage } from '../domain/entities.js';
import { StageNotFoundError } from '../domain/errors.js';
import { StageRepository } from '../domain/ports.js';
import type { CreateStageInput } from './create-stage.use-case.js';

export type UpdateStageInput = Partial<Omit<CreateStageInput, 'zoneId'>>;

export class UpdateStageUseCase {
  constructor(private readonly repository: StageRepository) {}
  async execute(id: number, input: UpdateStageInput): Promise<Stage> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new StageNotFoundError(id);
    return updated;
  }
}
