import { describe, expect, it, vi } from 'vitest';

import {
  CodeExecutionPort,
  ExecutionResult,
} from './domain/ports/code-execution.port.js';
import { UnsupportedLanguageError } from './domain/errors.js';
import { ExecuteCodeUseCase } from './application/execute-code.use-case.js';

const okResult: ExecutionResult = {
  stdout: 'hi\n',
  stderr: '',
  exitCode: 0,
  executionTimeMs: 42,
  requestDurationMs: 50,
  failureType: 'none',
};

describe('ExecuteCodeUseCase', () => {
  it('forwards a supported-language request to the execution provider', async () => {
    const codeExecution: CodeExecutionPort = {
      execute: vi.fn().mockResolvedValue(okResult),
    };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    const result = await useCase.execute(
      {
        language: 'python',
        code: "print('hi')",
        stdin: '',
      },
      'learner-1',
    );

    expect(codeExecution.execute).toHaveBeenCalledWith({
      language: 'python',
      code: "print('hi')",
      stdin: '',
    });
    expect(result).toEqual(okResult);
  });

  it('defaults stdin to an empty string when omitted', async () => {
    const codeExecution: CodeExecutionPort = {
      execute: vi.fn().mockResolvedValue(okResult),
    };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    await useCase.execute(
      { language: 'javascript', code: 'console.log(1)' },
      'learner-1',
    );

    expect(codeExecution.execute).toHaveBeenCalledWith(
      expect.objectContaining({ stdin: '' }),
    );
  });

  it.each(['cpp', 'c', 'python', 'javascript', 'java'])(
    'accepts the supported language %s',
    async (language) => {
      const codeExecution: CodeExecutionPort = {
        execute: vi.fn().mockResolvedValue(okResult),
      };
      const useCase = new ExecuteCodeUseCase(codeExecution);

      await expect(
        useCase.execute({ language, code: 'x' }, 'learner-1'),
      ).resolves.toEqual(okResult);
    },
  );

  it('rejects an unsupported language before calling the provider', async () => {
    const codeExecution: CodeExecutionPort = { execute: vi.fn() };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    await expect(
      useCase.execute({ language: 'ruby', code: 'puts 1' }, 'learner-1'),
    ).rejects.toBeInstanceOf(UnsupportedLanguageError);
    expect(codeExecution.execute).not.toHaveBeenCalled();
  });

  it('propagates provider errors (simulated execution failure)', async () => {
    const codeExecution: CodeExecutionPort = {
      execute: vi.fn().mockRejectedValue(new Error('provider unavailable')),
    };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    await expect(
      useCase.execute({ language: 'c', code: 'int main(){}' }, 'learner-1'),
    ).rejects.toThrow('provider unavailable');
  });

  it('limits concurrent executions per learner while allowing another learner', async () => {
    const finishes: ((result: ExecutionResult) => void)[] = [];
    const codeExecution: CodeExecutionPort = {
      execute: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            finishes.push(resolve);
          }),
      ),
    };
    const useCase = new ExecuteCodeUseCase(codeExecution);
    const first = useCase.execute(
      { language: 'python', code: 'x' },
      'learner-1',
    );
    await expect(
      useCase.execute({ language: 'python', code: 'x' }, 'learner-1'),
    ).rejects.toThrow('limit');
    const other = useCase.execute(
      { language: 'python', code: 'x' },
      'learner-2',
    );
    finishes[0](okResult);
    await first;
    finishes[1](okResult);
    await other;
  });

  it('limits each learner to ten requests per minute', async () => {
    const codeExecution: CodeExecutionPort = {
      execute: vi.fn().mockResolvedValue(okResult),
    };
    const useCase = new ExecuteCodeUseCase(codeExecution);
    for (let i = 0; i < 10; i++)
      await useCase.execute({ language: 'python', code: 'x' }, 'learner-1');
    await expect(
      useCase.execute({ language: 'python', code: 'x' }, 'learner-1'),
    ).rejects.toThrow('limit');
    await expect(
      useCase.execute({ language: 'python', code: 'x' }, 'learner-2'),
    ).resolves.toEqual(okResult);
  });
});
