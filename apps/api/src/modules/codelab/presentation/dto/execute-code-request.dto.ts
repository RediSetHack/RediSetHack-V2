import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import { SUPPORTED_LANGUAGES } from "../../domain/ports/code-execution.port.js";

const MAX_CODE_LENGTH = 20_000;
const MAX_STDIN_LENGTH = 10_000;

export class ExecuteCodeRequestDto {
  @IsIn(SUPPORTED_LANGUAGES)
  language!: string;

  @IsString()
  @MaxLength(MAX_CODE_LENGTH)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_STDIN_LENGTH)
  stdin?: string;
}
