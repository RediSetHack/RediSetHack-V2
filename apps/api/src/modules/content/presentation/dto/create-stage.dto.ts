import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayUnique,
  IsIn,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import type { LessonBlock } from '../../domain/entities.js';
import { COMPETENCIES } from '@repo/contracts';
import { normalizeLessonContent } from '../../domain/normalize-lesson-content.js';
import { IsLessonContent } from '../validators.js';
import { SLUG_PATTERN } from './slug-pattern.js';

const LESSON_CONTENT_EXAMPLE: LessonBlock[] = [
  { type: 'text', content: 'A loop repeats a block of code.' },
  {
    type: 'code',
    language: 'javascript',
    content: 'for (let i = 0; i < 3; i++) {}',
  },
  {
    type: 'exercise',
    prompt: 'Write a loop.',
    language: 'javascript',
    starterCode: '',
  },
  { type: 'image', url: 'https://example.com/loop.png', alt: 'A loop diagram' },
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
      '`{ type: "text", content }`, `{ type: "code", language, content }`, ' +
      '`{ type: "image", url, alt, caption? }`, or ' +
      '`{ type: "exercise", prompt, language, starterCode }`.',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeLessonContent(value))
  @IsLessonContent()
  lessonContent?: LessonBlock[];

  @ApiPropertyOptional({
    example: 10,
    description: 'XP awarded on completion.',
  })
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

  @ApiPropertyOptional({ enum: COMPETENCIES.map(({ id }) => id), isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(COMPETENCIES.map(({ id }) => id), { each: true })
  competencyIds?: string[];

  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced'], nullable: true })
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
}
