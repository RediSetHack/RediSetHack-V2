import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CodeExecutionPort,
  ExecutionRequest,
  ExecutionResult,
  SupportedLanguage,
} from '../domain/ports/code-execution.port.js';
import {
  CodeExecutionTimeoutError,
  CodeExecutionUnavailableError,
} from '../domain/errors.js';

// Piston (https://github.com/engineer-man/piston) is a free, keyless multi-language
// execution API — the lazy choice over Judge0/Glot.io, which both require provisioning
// an API key before anything can run.
const DEFAULT_PISTON_URL = 'https://emkc.org/api/v2/piston';
const PROVIDER_TIMEOUT_MS = 15_000;
const MAX_PROVIDER_RESPONSE_LENGTH = 64_000;

const PISTON_LANGUAGE: Record<SupportedLanguage, string> = {
  cpp: 'c++',
  c: 'c',
  python: 'python',
  javascript: 'javascript',
  java: 'java',
};

type PistonStage = {
  stdout: string;
  stderr: string;
  code: number | null;
  time?: number;
  signal?: string | null;
};
type PistonResponse = {
  run?: PistonStage | null;
  compile?: PistonStage | null;
  message?: string;
};

function isStage(value: unknown): value is PistonStage {
  if (typeof value !== 'object' || value === null) return false;
  const stage = value as Record<string, unknown>;
  return (
    typeof stage.stdout === 'string' &&
    typeof stage.stderr === 'string' &&
    (stage.code === null ||
      (typeof stage.code === 'number' && Number.isInteger(stage.code))) &&
    (stage.signal === undefined ||
      stage.signal === null ||
      typeof stage.signal === 'string') &&
    (stage.time === undefined ||
      (typeof stage.time === 'number' &&
        Number.isFinite(stage.time) &&
        stage.time >= 0))
  );
}

@Injectable()
export class PistonCodeExecutionService implements CodeExecutionPort {
  private readonly baseUrl: string;
  private readonly sandboxVerified: boolean;

  constructor(config: ConfigService) {
    this.baseUrl =
      config.get<string>('CODE_EXECUTION_API_URL') ?? DEFAULT_PISTON_URL;
    this.sandboxVerified =
      config.get<string>('CODE_EXECUTION_SANDBOX_VERIFIED') === 'true';
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    if (!this.sandboxVerified || this.baseUrl === DEFAULT_PISTON_URL) {
      throw new CodeExecutionUnavailableError();
    }
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        body: JSON.stringify({
          language: PISTON_LANGUAGE[request.language],
          version: '*',
          files: [{ content: request.code }],
          stdin: request.stdin,
        }),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        ['TimeoutError', 'AbortError'].includes(error.name)
      )
        throw new CodeExecutionTimeoutError();
      throw new CodeExecutionUnavailableError();
    }
    if (!response.ok) {
      throw new CodeExecutionUnavailableError();
    }

    let result: PistonResponse;
    try {
      const body = await response.text();
      if (body.length > MAX_PROVIDER_RESPONSE_LENGTH)
        throw new Error('Provider response too large');
      result = JSON.parse(body) as PistonResponse;
    } catch (error) {
      if (
        error instanceof Error &&
        ['TimeoutError', 'AbortError'].includes(error.name)
      )
        throw new CodeExecutionTimeoutError();
      throw new CodeExecutionUnavailableError();
    }
    const requestDurationMs = Date.now() - startedAt;
    if (
      typeof result !== 'object' ||
      result === null ||
      (result.run !== undefined &&
        result.run !== null &&
        !isStage(result.run)) ||
      (result.compile !== undefined && !isStage(result.compile)) ||
      (result.run == null && (!result.compile || result.compile.code === 0))
    ) {
      throw new CodeExecutionUnavailableError();
    }

    const stderr = [
      result.compile?.stderr,
      result.run?.stderr,
      result.run?.signal ? `Terminated by signal ${result.run.signal}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    const failureType =
      result.compile?.code !== undefined && result.compile.code !== 0
        ? 'compile'
        : result.run && result.run.code !== 0
          ? 'runtime'
          : 'none';
    const exitCode =
      result.run && result.run.code === null
        ? 1
        : (result.run?.code ?? result.compile?.code ?? 1);

    return {
      stdout: result.run?.stdout ?? result.compile?.stdout ?? '',
      stderr,
      exitCode,
      executionTimeMs: Math.round((result.run?.time ?? 0) * 1000),
      requestDurationMs,
      failureType,
    };
  }
}
