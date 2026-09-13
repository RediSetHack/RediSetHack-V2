import { Quest } from '../domain/entities.js';
import { QuestNotFoundError } from '../domain/errors.js';
import { QuestRepository } from '../domain/ports.js';

export class GetQuestUseCase {
  constructor(private readonly repository: QuestRepository) {}
  async execute(id: number): Promise<Quest> {
    const quest = await this.repository.findById(id);
    if (!quest) throw new QuestNotFoundError(id);
    return quest;
  }
}
