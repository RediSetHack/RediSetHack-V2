import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SLUG_PATTERN } from './slug-pattern.js';

export class CreateRegionRequestDto {
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

  @ApiPropertyOptional({ example: 'An introduction to the platform.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order among sibling Regions, ascending.',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
