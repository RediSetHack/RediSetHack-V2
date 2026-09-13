import { QuestNotFoundError } from '../domain/errors.js';
import { QuestRepository } from '../domain/ports.js';

export class DeleteQuestUseCase {
  constructor(private readonly repository: QuestRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new QuestNotFoundError(id);
  }
}
