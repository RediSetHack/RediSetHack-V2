import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

import type { BadgeCriteria } from '../../domain/entities.js';
import { IsBadgeCriteria } from '../validators.js';
import { SLUG_PATTERN } from './slug-pattern.js';

export class UpdateBadgeDefinitionRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN) slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBadgeCriteria() criteria?: BadgeCriteria;
  @IsOptional() @IsUrl() imageUrl?: string;
}
