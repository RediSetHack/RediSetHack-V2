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

export class CreateStageRequestDto {
  @IsInt() @Min(1) zoneId!: number;
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsLessonContent() lessonContent?: LessonBlock[];
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
  @IsOptional() @IsInt() sortOrder?: number;
}
