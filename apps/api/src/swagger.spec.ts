import { describe, expect, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { setupSwagger } from './swagger.js';

describe('setupSwagger', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates and returns the OpenAPI document', () => {
    const document = setupSwagger(app);

    expect(document).toBeDefined();
    expect(document.openapi).toMatch(/^3\./);
    expect(document.info.title).toBe('RediSetHack API');
    expect(document.info.description).toBe(
      'RediSetHack V2 REST API documentation',
    );
    expect(document.info.version).toBe('1.0');
    expect(document.components?.securitySchemes).toHaveProperty('bearer');
  });
});
