import { StageNotFoundError } from '../domain/errors.js';
import { StageRepository } from '../domain/ports.js';

export class DeleteStageUseCase {
  constructor(private readonly repository: StageRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new StageNotFoundError(id);
  }
}
