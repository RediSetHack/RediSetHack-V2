import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Carries the answer for the designated activity: `flag` for a CTF challenge, `code` for a coding activity. */
export class SubmitSideQuestDto {
  @ApiPropertyOptional({ example: 'RSH{example}', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  flag?: string;

  @ApiPropertyOptional({ maxLength: 20000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  code?: string;
}
