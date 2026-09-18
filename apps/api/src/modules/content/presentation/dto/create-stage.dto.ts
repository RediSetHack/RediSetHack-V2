import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { LessonBlock } from '../../domain/entities.js';
import { IsLessonContent } from '../validators.js';
import { SLUG_PATTERN } from './slug-pattern.js';

const LESSON_CONTENT_EXAMPLE: LessonBlock[] = [
  { type: 'text', content: 'A loop repeats a block of code.' },
  { type: 'code', language: 'javascript', code: 'for (let i = 0; i < 3; i++) {}' },
];

export class CreateStageRequestDto {
  @ApiProperty({ example: 1, description: 'The parent Zone’s id.' })
  @IsInt()
  @Min(1)
  zoneId!: number;

  @ApiProperty({ example: 'What is a Loop?' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'what-is-a-loop',
    description: 'Lowercase, hyphen-separated identifier.',
    pattern: SLUG_PATTERN.source,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    example: LESSON_CONTENT_EXAMPLE,
    description:
      'The Lesson body as an ordered array of blocks. Each block is one of ' +
      '`{ type: "text", content }`, `{ type: "code", language, code }`, or ' +
      '`{ type: "image", url, caption? }`.',
  })
  @IsOptional()
  @IsLessonContent()
  lessonContent?: LessonBlock[];

  @ApiPropertyOptional({ example: 10, description: 'XP awarded on completion.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpReward?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order among sibling Stages, ascending.',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
