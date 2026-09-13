import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

import type { LessonBlock } from '../../domain/entities.js';
import { IsLessonContent } from '../validators.js';
import { SLUG_PATTERN } from './slug-pattern.js';

export class UpdateStageRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN) slug?: string;
  @IsOptional() @IsLessonContent() lessonContent?: LessonBlock[];
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
  @IsOptional() @IsInt() sortOrder?: number;
}
