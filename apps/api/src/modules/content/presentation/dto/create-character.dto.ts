import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

import { SLUG_PATTERN } from './slug-pattern.js';

export class CreateCharacterRequestDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl() imageUrl?: string;
}
