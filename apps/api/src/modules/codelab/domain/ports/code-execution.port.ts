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
  executionTimeMs: number;
};

export abstract class CodeExecutionPort {
  abstract execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
