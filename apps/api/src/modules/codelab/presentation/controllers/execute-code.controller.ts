import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ExecuteCodeUseCase } from '../../application/execute-code.use-case.js';
import { UnsupportedLanguageError } from '../../domain/errors.js';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { ExecuteCodeRequestDto } from '../dto/execute-code-request.dto.js';

@Controller('v1/api/codelab')
export class ExecuteCodeController {
  constructor(private readonly executeCode: ExecuteCodeUseCase) {}

  @Post('execute')
  @UseGuards(ClerkAuthGuard)
  async handle(@Body() dto: ExecuteCodeRequestDto) {
    try {
      return await this.executeCode.execute(dto);
    } catch (error) {
      if (error instanceof UnsupportedLanguageError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
