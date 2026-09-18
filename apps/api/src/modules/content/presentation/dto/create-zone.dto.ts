import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SLUG_PATTERN } from './slug-pattern.js';

export class CreateZoneRequestDto {
  @ApiProperty({ example: 1, description: 'The parent Region’s id.' })
  @IsInt()
  @Min(1)
  regionId!: number;

  @ApiProperty({ example: 'Arrays & Loops' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'arrays-and-loops',
    description: 'Lowercase, hyphen-separated identifier.',
    pattern: SLUG_PATTERN.source,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;

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
