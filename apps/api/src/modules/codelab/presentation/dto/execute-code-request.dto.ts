import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SUPPORTED_LANGUAGES } from '../../domain/ports/code-execution.port.js';

const MAX_CODE_LENGTH = 20_000;
const MAX_STDIN_LENGTH = 10_000;

export class ExecuteCodeRequestDto {
  @ApiProperty({ enum: SUPPORTED_LANGUAGES, example: SUPPORTED_LANGUAGES[0] })
  @IsIn(SUPPORTED_LANGUAGES)
  language!: string;

  @ApiProperty({
    example: 'print("hello")',
    maxLength: MAX_CODE_LENGTH,
  })
  @IsString()
  @MaxLength(MAX_CODE_LENGTH)
  code!: string;

  @ApiPropertyOptional({ example: '', maxLength: MAX_STDIN_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_STDIN_LENGTH)
  stdin?: string;
}
