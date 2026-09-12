import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CodeExecutionPort, ExecutionRequest, ExecutionResult, SupportedLanguage } from "../domain/ports/code-execution.port.js";

// Piston (https://github.com/engineer-man/piston) is a free, keyless multi-language
// execution API — the lazy choice over Judge0/Glot.io, which both require provisioning
// an API key before anything can run.
const DEFAULT_PISTON_URL = "https://emkc.org/api/v2/piston";

const PISTON_LANGUAGE: Record<SupportedLanguage, string> = {
  cpp: "c++",
  c: "c",
  python: "python",
  javascript: "javascript",
  java: "java",
};

type PistonResponse = {
  run?: { stdout: string; stderr: string; code: number | null };
  compile?: { stdout: string; stderr: string; code: number | null };
  message?: string;
};

@Injectable()
export class PistonCodeExecutionService implements CodeExecutionPort {
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>("CODE_EXECUTION_API_URL") ?? DEFAULT_PISTON_URL;
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startedAt = Date.now();
    const response = await fetch(`${this.baseUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: PISTON_LANGUAGE[request.language],
        version: "*",
        files: [{ content: request.code }],
        stdin: request.stdin,
      }),
    });
    const executionTimeMs = Date.now() - startedAt;

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Code execution provider request failed (${response.status}): ${body}`);
    }

    const result = (await response.json()) as PistonResponse;
    if (!result.run) {
      throw new Error(result.message ?? "Code execution provider returned no run result");
    }

    const stderr = [result.compile?.stderr, result.run.stderr].filter(Boolean).join("\n");
    const exitCode = result.run.code ?? result.compile?.code ?? 1;

    return {
      stdout: result.run.stdout,
      stderr,
      exitCode,
      executionTimeMs,
    };
  }
}
