import { Quest } from '../domain/entities.js';
import { QuestNotFoundError } from '../domain/errors.js';
import { QuestRepository } from '../domain/ports.js';
import type { CreateQuestInput } from './create-quest.use-case.js';
import { requireCompetencyTaggedQuestions } from './initial-assessment.js';

export type UpdateQuestInput = Partial<Omit<CreateQuestInput, 'stageId'>>;

export class UpdateQuestUseCase {
  constructor(private readonly repository: QuestRepository) {}
  async execute(id: number, input: UpdateQuestInput): Promise<Quest> {
    const current = await this.repository.findById(id);
    if (!current) throw new QuestNotFoundError(id);
    const questions = input.questions ?? current.questions;
    if (input.initialAssessment ?? current.initialAssessment)
      requireCompetencyTaggedQuestions(questions);
    const updated = await this.repository.update(id, input);
    if (!updated) throw new QuestNotFoundError(id);
    return updated;
  }
}
