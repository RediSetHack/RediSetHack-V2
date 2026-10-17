export class UnsupportedLanguageError extends Error {
  constructor(language: string) {
    super(`Unsupported language: ${language}`);
    this.name = 'UnsupportedLanguageError';
  }
}

export class CodeExecutionLimitError extends Error {
  constructor() {
    super('Code execution limit reached. Wait before running another program.');
    this.name = 'CodeExecutionLimitError';
  }
}

export class CodeExecutionTimeoutError extends Error {
  constructor() {
    super('Code execution timed out. Your code is still here — try again.');
    this.name = 'CodeExecutionTimeoutError';
  }
}

export class CodeExecutionUnavailableError extends Error {
  constructor(message = 'Code execution is temporarily unavailable.') {
    super(message);
    this.name = 'CodeExecutionUnavailableError';
  }
}
