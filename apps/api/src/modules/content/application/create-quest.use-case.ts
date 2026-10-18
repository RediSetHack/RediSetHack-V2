import { Quest, QuestQuestion } from '../domain/entities.js';
import { ParentStageNotFoundError } from '../domain/errors.js';
import { QuestRepository, StageRepository } from '../domain/ports.js';
import { requireCompetencyTaggedQuestions } from './initial-assessment.js';

export type CreateQuestInput = {
  stageId: number;
  title: string;
  description?: string | null;
  timeLimitSeconds?: number;
  passingScore?: number;
  xpReward?: number;
  initialAssessment?: boolean;
  questions: QuestQuestion[];
};

export class CreateQuestUseCase {
  constructor(
    private readonly repository: QuestRepository,
    private readonly stages: StageRepository,
  ) {}
  async execute(input: CreateQuestInput): Promise<Quest> {
    const stage = await this.stages.findById(input.stageId);
    if (!stage) throw new ParentStageNotFoundError(input.stageId);
    if (input.initialAssessment)
      requireCompetencyTaggedQuestions(input.questions);
    return this.repository.create({
      stageId: input.stageId,
      title: input.title,
      description: input.description ?? null,
      timeLimitSeconds: input.timeLimitSeconds ?? 60,
      passingScore: input.passingScore ?? 70,
      xpReward: input.xpReward ?? 0,
      initialAssessment: input.initialAssessment ?? false,
      questions: input.questions,
    });
  }
}
