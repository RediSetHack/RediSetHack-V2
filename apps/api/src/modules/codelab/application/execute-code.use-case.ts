import { Injectable } from '@nestjs/common';

import {
  CodeExecutionPort,
  ExecutionResult,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../domain/ports/code-execution.port.js';
import {
  CodeExecutionLimitError,
  UnsupportedLanguageError,
} from '../domain/errors.js';

const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;

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
  // shortcut: per-process counters, shared multi-replica deployments must replace with Redis.
  private readonly activeLearners = new Set<string>();
  private readonly requestsByLearner = new Map<string, number[]>();

  constructor(private readonly codeExecution: CodeExecutionPort) {}

  async execute(
    input: ExecuteCodeInput,
    learnerId: string,
  ): Promise<ExecutionResult> {
    if (!isSupportedLanguage(input.language)) {
      throw new UnsupportedLanguageError(input.language);
    }
    const now = Date.now();
    for (const [id, timestamps] of this.requestsByLearner) {
      const unexpired = timestamps.filter(
        (timestamp) => now - timestamp < REQUEST_WINDOW_MS,
      );
      if (unexpired.length) this.requestsByLearner.set(id, unexpired);
      else this.requestsByLearner.delete(id);
    }
    const recent = (this.requestsByLearner.get(learnerId) ?? []).filter(
      (timestamp) => now - timestamp < REQUEST_WINDOW_MS,
    );
    if (
      this.activeLearners.has(learnerId) ||
      recent.length >= MAX_REQUESTS_PER_WINDOW
    ) {
      this.requestsByLearner.set(learnerId, recent);
      throw new CodeExecutionLimitError();
    }

    recent.push(now);
    this.requestsByLearner.set(learnerId, recent);
    this.activeLearners.add(learnerId);
    try {
      return await this.codeExecution.execute({
        language: input.language,
        code: input.code,
        stdin: input.stdin ?? '',
      });
    } finally {
      this.activeLearners.delete(learnerId);
    }
  }
}
