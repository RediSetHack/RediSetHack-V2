import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import type { QuestQuestion } from '../../domain/entities.js';
import { IsQuestQuestions } from '../validators.js';

const QUESTIONS_EXAMPLE: QuestQuestion[] = [
  {
    id: 'q1',
    prompt: 'Which keyword declares a constant in JavaScript?',
    options: [
      { id: 'a', text: 'let' },
      { id: 'b', text: 'const' },
    ],
    correctOptionId: 'b',
  },
];

export class UpdateQuestRequestDto {
  @ApiPropertyOptional({ example: 'Loops Checkpoint' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: 'A short quiz on iteration.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 300, description: 'Time limit, in seconds.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitSeconds?: number;

  @ApiPropertyOptional({
    example: 70,
    description: 'Minimum score, 0–100, to pass.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  passingScore?: number;

  @ApiPropertyOptional({ example: 20, description: 'XP awarded on passing.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    example: QUESTIONS_EXAMPLE,
    description:
      'Each question is `{ id, prompt, options: [{ id, text }], correctOptionId }`.',
  })
  @IsOptional()
  @IsQuestQuestions()
  questions?: QuestQuestion[];
}
