import { Quest } from '../domain/entities.js';
import { QuestRepository } from '../domain/ports.js';

export class ListQuestsUseCase {
  constructor(private readonly repository: QuestRepository) {}
  execute(): Promise<Quest[]> {
    return this.repository.findAll();
  }
}
