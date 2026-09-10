import { IsInt, IsNotEmpty, Min } from "class-validator";

export class SelectCharacterRequestDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  characterId!: number;
}