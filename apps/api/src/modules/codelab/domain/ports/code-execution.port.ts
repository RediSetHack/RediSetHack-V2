export const SUPPORTED_LANGUAGES = [
  'cpp',
  'c',
  'python',
  'javascript',
  'java',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type ExecutionRequest = {
  language: SupportedLanguage;
  code: string;
  stdin: string;
};

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  /** Time spent executing learner code inside the provider sandbox. */
  executionTimeMs: number;
  /** End-to-end duration of the API request to the provider. */
  requestDurationMs: number;
  failureType: 'none' | 'compile' | 'runtime' | 'timeout';
};

export abstract class CodeExecutionPort {
  abstract execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
