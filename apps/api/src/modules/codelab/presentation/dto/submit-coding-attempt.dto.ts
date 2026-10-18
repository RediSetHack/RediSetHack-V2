import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const MAX_CODE_LENGTH = 20_000;

export class SubmitCodingAttemptDto {
  @ApiProperty({ example: 'print(sum(map(int, input().split())))', maxLength: MAX_CODE_LENGTH })
  @IsString()
  @MaxLength(MAX_CODE_LENGTH)
  code!: string;
}
