import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import type { QuestQuestion } from '../../domain/entities.js';
import { IsQuestQuestions } from '../validators.js';

export class UpdateQuestRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) timeLimitSeconds?: number;
  @IsOptional() @IsInt() @Min(0) passingScore?: number;
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
  @IsOptional() @IsQuestQuestions() questions?: QuestQuestion[];
}
