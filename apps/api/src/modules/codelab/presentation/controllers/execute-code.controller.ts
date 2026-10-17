import {
  BadRequestException,
  Body,
  Controller,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ExecuteCodeResponseSchema } from '@repo/contracts';

import { ExecuteCodeUseCase } from '../../application/execute-code.use-case.js';
import { UnsupportedLanguageError } from '../../domain/errors.js';
import {
  CodeExecutionLimitError,
  CodeExecutionTimeoutError,
  CodeExecutionUnavailableError,
} from '../../domain/errors.js';
import { ClerkAuthGuard } from '../../../auth/presentation/guards/clerk-auth.guard.js';
import { ExecuteCodeRequestDto } from '../dto/execute-code-request.dto.js';
import { ApiZodResponse } from '../../../../swagger/api-zod-response.decorator.js';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator.js';
import type { ClerkAuthenticatedUser } from '../../../auth/domain/ports/clerk-auth.port.js';

@ApiTags('Codelab')
@Controller('v1/api/codelab')
export class ExecuteCodeController {
  constructor(private readonly executeCode: ExecuteCodeUseCase) {}

  @Post('execute')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run a Codelab code submission.' })
  @ApiZodResponse(ExecuteCodeResponseSchema, { status: 201 })
  @ApiBadRequestResponse({ description: 'Unsupported language.' })
  async handle(
    @Body() dto: ExecuteCodeRequestDto,
    @CurrentUser() learner: ClerkAuthenticatedUser,
  ) {
    try {
      return await this.executeCode.execute(dto, learner.id);
    } catch (error) {
      if (error instanceof UnsupportedLanguageError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof CodeExecutionLimitError)
        throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
      if (error instanceof CodeExecutionTimeoutError)
        throw new GatewayTimeoutException(error.message);
      if (error instanceof CodeExecutionUnavailableError)
        throw new ServiceUnavailableException(error.message);
      throw error;
    }
  }
}
