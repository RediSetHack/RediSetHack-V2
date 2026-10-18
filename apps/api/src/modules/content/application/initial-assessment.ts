import { BadRequestException } from '@nestjs/common';
import type { QuestQuestion } from '../domain/entities.js';

export function requireCompetencyTaggedQuestions(
  questions: QuestQuestion[],
): void {
  if (
    questions.length === 0 ||
    questions.some((question) => !question.competencyIds?.length)
  ) {
    throw new BadRequestException(
      'An initial assessment must contain competency-tagged questions.',
    );
  }
}
