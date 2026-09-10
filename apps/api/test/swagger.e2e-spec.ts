import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { setupSwagger } from './../src/swagger.js';

describe('Swagger (e2e)', () => {
  describe('when in development mode (Swagger enabled)', () => {
    let app: INestApplication;

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      setupSwagger(app);
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('serves Swagger UI on GET /docs/', async () => {
      const response = await request(app.getHttpServer()).get('/docs/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger-ui');
    });

    it('serves OpenAPI specification on GET /docs-json', async () => {
      const response = await request(app.getHttpServer()).get('/docs-json');
      expect(response.status).toBe(200);
      expect(response.body.info.title).toBe('RediSetHack API');
    });
  });

  describe('when in production mode (Swagger disabled)', () => {
    let app: INestApplication;

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      // Swagger is not registered in production mode
      await app.init();
    });

    afterEach(async () => {
      await app.close();
    });

    it('does not expose GET /docs/ (returns 404)', async () => {
      const response = await request(app.getHttpServer()).get('/docs/');
      expect(response.status).toBe(404);
    });

    it('does not expose GET /docs-json (returns 404)', async () => {
      const response = await request(app.getHttpServer()).get('/docs-json');
      expect(response.status).toBe(404);
    });
  });
});
