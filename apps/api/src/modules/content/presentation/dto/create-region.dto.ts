import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import { SLUG_PATTERN } from './slug-pattern.js';

export class CreateRegionRequestDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}
