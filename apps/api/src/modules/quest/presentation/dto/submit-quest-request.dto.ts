import { Type } from "class-transformer";
import { IsArray, IsInt, Min, ValidateNested } from "class-validator";

export class QuestResponseDto {
  @IsInt()
  @Min(1)
  questionId!: number;

  @IsInt()
  @Min(1)
  optionId!: number;
}

export class SubmitQuestRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestResponseDto)
  responses!: QuestResponseDto[];
}
