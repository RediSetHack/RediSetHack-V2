import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, Min } from "class-validator";

import type { BadgeCriteria, LessonBlock, QuestQuestion } from "../domain/entities.js";
import { IsBadgeCriteria, IsLessonContent, IsQuestQuestions } from "./validators.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// --- Regions -------------------------------------------------------------

export class CreateRegionRequestDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateRegionRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN) slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

// --- Zones -----------------------------------------------------------

export class CreateZoneRequestDto {
  @IsInt() @Min(1) regionId!: number;
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateZoneRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN) slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

// --- Stages ----------------------------------------------------------

export class CreateStageRequestDto {
  @IsInt() @Min(1) zoneId!: number;
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsLessonContent() lessonContent?: LessonBlock[];
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateStageRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN) slug?: string;
  @IsOptional() @IsLessonContent() lessonContent?: LessonBlock[];
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
  @IsOptional() @IsInt() sortOrder?: number;
}

// --- Quests ------------------------------------------------------------

export class CreateQuestRequestDto {
  @IsInt() @Min(1) stageId!: number;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) timeLimitSeconds?: number;
  @IsOptional() @IsInt() @Min(0) passingScore?: number;
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
  @IsOptional() @IsQuestQuestions() questions?: QuestQuestion[];
}

export class UpdateQuestRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) timeLimitSeconds?: number;
  @IsOptional() @IsInt() @Min(0) passingScore?: number;
  @IsOptional() @IsInt() @Min(0) xpReward?: number;
  @IsOptional() @IsQuestQuestions() questions?: QuestQuestion[];
}

// --- Badge definitions -------------------------------------------------

export class CreateBadgeDefinitionRequestDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsBadgeCriteria() criteria!: BadgeCriteria;
  @IsOptional() @IsUrl() imageUrl?: string;
}

export class UpdateBadgeDefinitionRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN) slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBadgeCriteria() criteria?: BadgeCriteria;
  @IsOptional() @IsUrl() imageUrl?: string;
}

// --- Characters ----------------------------------------------------------

export class CreateCharacterRequestDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @Matches(SLUG_PATTERN) slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl() imageUrl?: string;
}

export class UpdateCharacterRequestDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsString() @Matches(SLUG_PATTERN) slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl() imageUrl?: string;
}
