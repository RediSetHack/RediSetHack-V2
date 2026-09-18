import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { IncomingMessage } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecuteCodeResponseSchema } from '@repo/contracts';

import {
  ClerkAuthPort,
  type ClerkAuthenticatedUser,
} from '../auth/domain/ports/clerk-auth.port.js';
import { UserRepository } from '../auth/domain/ports/user.repository.js';
import { EnsureUserUseCase } from '../auth/application/ensure-user.use-case.js';
import { makeFakeUserRepository } from '../auth/fake-user.fixture.js';
import { ClerkAuthGuard } from '../auth/presentation/guards/clerk-auth.guard.js';
import { CodeExecutionPort } from './domain/ports/code-execution.port.js';
import { ExecuteCodeUseCase } from './application/execute-code.use-case.js';
import { ExecuteCodeController } from './presentation/controllers/execute-code.controller.js';

describe('POST /v1/api/codelab/execute integration', () => {
  let app: INestApplication;

  const fakeCodeExecution: CodeExecutionPort = {
    execute: vi.fn().mockResolvedValue({
      stdout: 'hello, world\n',
      stderr: '',
      exitCode: 0,
      executionTimeMs: 12,
    }),
  };

  const fakeUsers = makeFakeUserRepository();

  const fakeClerk: ClerkAuthPort = {
    async authenticate(req: IncomingMessage) {
      if (req.headers['authorization'] !== 'Bearer valid-token') return null;
      return {
        id: 'user_learner',
        email: 'learner@example.com',
        name: 'Learner',
        role: 'user',
      } satisfies ClerkAuthenticatedUser;
    },
  };

  beforeEach(async () => {
    vi.mocked(fakeCodeExecution.execute).mockReset();
    vi.mocked(fakeCodeExecution.execute).mockResolvedValue({
      stdout: 'hello, world\n',
      stderr: '',
      exitCode: 0,
      executionTimeMs: 12,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [ExecuteCodeController],
      providers: [
        { provide: CodeExecutionPort, useValue: fakeCodeExecution },
        { provide: UserRepository, useValue: fakeUsers },
        { provide: ClerkAuthPort, useValue: fakeClerk },
        ClerkAuthGuard,
        EnsureUserUseCase,
        ExecuteCodeUseCase,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const asLearner = () => ({ authorization: 'Bearer valid-token' });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/codelab/execute')
      .send({ language: 'python', code: 'print(1)', stdin: '' });
    expect(res.status).toBe(401);
  });

  it('executes code and returns stdout, stderr, and the exit code', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/codelab/execute')
      .set(asLearner())
      .send({ language: 'python', code: 'print("hello, world")', stdin: '' });

    expect(res.status).toBe(201);
    const body = ExecuteCodeResponseSchema.parse(res.body);
    expect(body).toEqual({
      stdout: 'hello, world\n',
      stderr: '',
      exitCode: 0,
      executionTimeMs: 12,
    });
    expect(fakeCodeExecution.execute).toHaveBeenCalledWith({
      language: 'python',
      code: 'print("hello, world")',
      stdin: '',
    });
  });

  it('surfaces compile and runtime errors as first-class output', async () => {
    vi.mocked(fakeCodeExecution.execute).mockResolvedValue({
      stdout: '',
      stderr: "NameError: name 'x' is not defined",
      exitCode: 1,
      executionTimeMs: 4,
    });

    const res = await request(app.getHttpServer())
      .post('/v1/api/codelab/execute')
      .set(asLearner())
      .send({ language: 'python', code: 'print(x)', stdin: '' });

    const body = ExecuteCodeResponseSchema.parse(res.body);
    expect(body.stdout).toBe('');
    expect(body.stderr).toContain('NameError');
    expect(body.exitCode).toBe(1);
  });

  it('rejects an unsupported language with 400 and a clear message', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/api/codelab/execute')
      .set(asLearner())
      .send({ language: 'cobol', code: 'DISPLAY 1.', stdin: '' });

    expect(res.status).toBe(400);
  });
});