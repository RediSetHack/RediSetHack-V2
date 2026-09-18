import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SLUG_PATTERN } from './slug-pattern.js';

export class CreateCharacterRequestDto {
  @ApiProperty({ example: 'Ada' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'ada',
    description: 'Lowercase, hyphen-separated identifier.',
    pattern: SLUG_PATTERN.source,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;

  @ApiPropertyOptional({ example: 'A pioneer of computer programming.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/ada.png' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
