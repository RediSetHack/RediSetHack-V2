import { IsInt, IsNotEmpty, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SelectCharacterRequestDto {
  @ApiProperty({ example: 1, description: "The chosen Character's id." })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  characterId!: number;
}