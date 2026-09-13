import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

import { SLUG_PATTERN } from './slug-pattern.js';

export class CreateZoneRequestDto {
  @IsInt() @Min(1) regionId!: number;
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}
