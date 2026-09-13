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

export class CreateBadgeDefinitionRequestDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsBadgeCriteria() criteria!: BadgeCriteria;
  @IsOptional() @IsUrl() imageUrl?: string;
}
