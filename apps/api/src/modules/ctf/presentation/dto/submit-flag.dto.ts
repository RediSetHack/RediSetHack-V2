import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitFlagDto {
  @ApiProperty({ example: 'RSH{example}', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  flag!: string;
}
