import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SLUG_PATTERN } from './slug-pattern.js';

export class CreateHierarchyNodeRequestDto {
  @ApiProperty({ example: 'Getting Started' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'getting-started',
    description: 'Lowercase, hyphen-separated identifier.',
    pattern: SLUG_PATTERN.source,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({ example: 'An introduction.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order among siblings, ascending.',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
