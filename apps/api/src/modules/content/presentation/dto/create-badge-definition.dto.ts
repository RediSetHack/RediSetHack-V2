import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { BadgeCriteria } from '../../domain/entities.js';
import { IsBadgeCriteria } from '../validators.js';
import { SLUG_PATTERN } from './slug-pattern.js';

const CRITERIA_EXAMPLE: BadgeCriteria = {
  trigger: 'cumulative',
  target: 'xp',
  threshold: 1000,
};

export class CreateBadgeDefinitionRequestDto {
  @ApiProperty({ example: 'Quick Learner' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'quick-learner',
    description: 'Lowercase, hyphen-separated identifier.',
    pattern: SLUG_PATTERN.source,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({ example: 'Earned by reaching 1000 total XP.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: CRITERIA_EXAMPLE,
    description:
      'The milestone that awards this Badge: `{ trigger: "cumulative" | ' +
      '"category" | "activity", target, threshold }`.',
  })
  @IsBadgeCriteria()
  criteria!: BadgeCriteria;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/badge.png' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
