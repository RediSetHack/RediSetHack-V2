import { Injectable } from "@nestjs/common";

import {
  CodeExecutionPort,
  ExecutionResult,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from "../domain/ports/code-execution.port.js";
import { UnsupportedLanguageError } from "../domain/errors.js";

export type ExecuteCodeInput = {
  language: string;
  code: string;
  stdin?: string;
};

function isSupportedLanguage(language: string): language is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

@Injectable()
export class ExecuteCodeUseCase {
  constructor(private readonly codeExecution: CodeExecutionPort) {}

  async execute(input: ExecuteCodeInput): Promise<ExecutionResult> {
    if (!isSupportedLanguage(input.language)) {
      throw new UnsupportedLanguageError(input.language);
    }
    return this.codeExecution.execute({
      language: input.language,
      code: input.code,
      stdin: input.stdin ?? "",
    });
  }
}
