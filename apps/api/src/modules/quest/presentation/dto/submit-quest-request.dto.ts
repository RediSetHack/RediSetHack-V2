import { Type } from "class-transformer";
import { IsArray, IsInt, Min, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class QuestResponseDto {
  @ApiProperty({ example: 1, description: "The answered Question's id." })
  @IsInt()
  @Min(1)
  questionId!: number;

  @ApiProperty({ example: 1, description: "The chosen option's id." })
  @IsInt()
  @Min(1)
  optionId!: number;
}

export class SubmitQuestRequestDto {
  @ApiProperty({
    type: () => QuestResponseDto,
    isArray: true,
    description: "The learner's answer to every question in the Quest.",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestResponseDto)
  responses!: QuestResponseDto[];
}
