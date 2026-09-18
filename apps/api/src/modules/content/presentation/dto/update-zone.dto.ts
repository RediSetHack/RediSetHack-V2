import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { SLUG_PATTERN } from './slug-pattern.js';

export class UpdateZoneRequestDto {
  @ApiPropertyOptional({ example: 'Arrays & Loops' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'arrays-and-loops',
    description: 'Lowercase, hyphen-separated identifier.',
    pattern: SLUG_PATTERN.source,
  })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN)
  slug?: string;

  @ApiPropertyOptional({ example: 'Core iteration concepts.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order among sibling Zones, ascending.',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
