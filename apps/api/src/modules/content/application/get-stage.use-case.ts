import { Stage } from '../domain/entities.js';
import { StageNotFoundError } from '../domain/errors.js';
import { StageRepository } from '../domain/ports.js';

export class GetStageUseCase {
  constructor(private readonly repository: StageRepository) {}
  async execute(id: number): Promise<Stage> {
    const stage = await this.repository.findById(id);
    if (!stage) throw new StageNotFoundError(id);
    return stage;
  }
}
