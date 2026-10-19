import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class LearningStreakQueryDto {
  @ApiPropertyOptional({ example: "2026-01-01", description: "First Asia/Manila day (YYYY-MM-DD). Defaults to 364 days before `to`." })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: "2026-10-19", description: "Last Asia/Manila day, not in the future. Defaults to today." })
  @IsOptional()
  @IsString()
  to?: string;
}
