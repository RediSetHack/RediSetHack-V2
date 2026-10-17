import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PistonCodeExecutionService } from './infrastructure/piston-code-execution.service.js';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

describe('PistonCodeExecutionService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('builds the provider request payload from the execution request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ run: { stdout: 'hi\n', stderr: '', code: 0 } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const config = {
      get: vi.fn((key: string) =>
        key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
          ? 'true'
          : key === 'CODE_EXECUTION_API_URL'
            ? 'http://piston.test/api/v2/piston'
            : undefined,
      ),
    } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    await service.execute({
      language: 'cpp',
      code: 'int main(){}',
      stdin: '5\n',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://piston.test/api/v2/piston/execute',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          language: 'c++',
          version: '*',
          files: [{ content: 'int main(){}' }],
          stdin: '5\n',
        }),
      }),
    );
  });

  it.each([
    ['cpp', 'c++'],
    ['c', 'c'],
    ['python', 'python'],
    ['javascript', 'javascript'],
    ['java', 'java'],
  ] as const)(
    'sends supported language %s to Piston as %s',
    async (language, pistonLanguage) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ run: { stdout: '', stderr: '', code: 0 } }),
        );
      vi.stubGlobal('fetch', fetchMock);
      const config = {
        get: vi.fn((key: string) =>
          key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
            ? 'true'
            : key === 'CODE_EXECUTION_API_URL'
              ? 'http://piston.test/api/v2/piston'
              : undefined,
        ),
      } as unknown as ConfigService;
      await new PistonCodeExecutionService(config).execute({
        language,
        code: 'x',
        stdin: '',
      });
      expect(
        JSON.parse(fetchMock.mock.calls[0][1].body as string).language,
      ).toBe(pistonLanguage);
    },
  );

  it('parses a successful run result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          run: { stdout: 'hi\n', stderr: '', code: 0, time: 0.031 },
        }),
      ),
    );
    const config = {
      get: vi.fn((key: string) =>
        key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
          ? 'true'
          : key === 'CODE_EXECUTION_API_URL'
            ? 'http://piston.test/api/v2/piston'
            : undefined,
      ),
    } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    const result = await service.execute({
      language: 'python',
      code: "print('hi')",
      stdin: '',
    });

    expect(result.stdout).toBe('hi\n');
    expect(result.stderr).toBe('');
    expect(result.exitCode).toBe(0);
    expect(result.executionTimeMs).toBe(31);
    expect(result.requestDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('returns compile-only failures when the provider omits run output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          compile: { stdout: '', stderr: 'syntax error', code: 1 },
        }),
      ),
    );
    const config = {
      get: vi.fn((key: string) =>
        key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
          ? 'true'
          : key === 'CODE_EXECUTION_API_URL'
            ? 'http://piston.test/api/v2/piston'
            : undefined,
      ),
    } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    const result = await service.execute({
      language: 'java',
      code: 'broken',
      stdin: '',
    });

    expect(result.stderr).toBe('syntax error');
    expect(result.exitCode).toBe(1);
    expect(result.failureType).toBe('compile');
    expect(result.executionTimeMs).toBe(0);
    expect(result.requestDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.failureType).toBe('compile');
  });

  it('throws when the provider responds with an error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({}, false, 500)),
    );
    const config = {
      get: vi.fn((key: string) =>
        key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
          ? 'true'
          : key === 'CODE_EXECUTION_API_URL'
            ? 'http://piston.test/api/v2/piston'
            : undefined,
      ),
    } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    await expect(
      service.execute({ language: 'c', code: 'x', stdin: '' }),
    ).rejects.toThrow('unavailable');
  });

  it('fails closed when sandbox isolation has not been verified', async () => {
    const service = new PistonCodeExecutionService({
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ConfigService);
    await expect(
      service.execute({ language: 'python', code: 'x', stdin: '' }),
    ).rejects.toThrow('unavailable');
  });

  it('rejects malformed provider responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ run: { stdout: 1, stderr: '', code: 0 } }),
        ),
    );
    const config = {
      get: vi.fn((key: string) =>
        key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
          ? 'true'
          : key === 'CODE_EXECUTION_API_URL'
            ? 'http://piston.test/api/v2/piston'
            : undefined,
      ),
    } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);
    await expect(
      service.execute({ language: 'python', code: 'x', stdin: '' }),
    ).rejects.toThrow('unavailable');
  });

  it('rejects oversized provider output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(' '.repeat(64_001))),
    );
    const config = {
      get: vi.fn((key: string) =>
        key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
          ? 'true'
          : key === 'CODE_EXECUTION_API_URL'
            ? 'http://piston.test/api/v2/piston'
            : undefined,
      ),
    } as unknown as ConfigService;
    await expect(
      new PistonCodeExecutionService(config).execute({
        language: 'python',
        code: 'x',
        stdin: '',
      }),
    ).rejects.toThrow('unavailable');
  });

  it('maps provider request timeouts to a learner-safe timeout error', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('timeout'), { name: 'TimeoutError' }),
        ),
    );
    const config = {
      get: vi.fn((key: string) =>
        key === 'CODE_EXECUTION_SANDBOX_VERIFIED'
          ? 'true'
          : key === 'CODE_EXECUTION_API_URL'
            ? 'http://piston.test/api/v2/piston'
            : undefined,
      ),
    } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);
    await expect(
      service.execute({ language: 'python', code: 'x', stdin: '' }),
    ).rejects.toThrow('timed out');
  });
});
