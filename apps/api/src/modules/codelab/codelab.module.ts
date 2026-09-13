import { Module } from '@nestjs/common';

import { CodeExecutionPort } from './domain/ports/code-execution.port.js';
import { ExecuteCodeUseCase } from './application/execute-code.use-case.js';
import { PistonCodeExecutionService } from './infrastructure/piston-code-execution.service.js';
import { ExecuteCodeController } from './presentation/controllers/execute-code.controller.js';

@Module({
  controllers: [ExecuteCodeController],
  providers: [
    { provide: CodeExecutionPort, useClass: PistonCodeExecutionService },
    ExecuteCodeUseCase,
  ],
})
export class CodelabModule {}
