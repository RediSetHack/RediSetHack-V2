import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiZodResponse } from './api-zod-response.decorator.js';

const SampleSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
});

@Controller('sample')
class SampleController {
  @Get()
  @ApiZodResponse(SampleSchema)
  handle() {
    return { id: 1, name: 'sample' };
  }
}

describe('ApiZodResponse', () => {
  it('documents the response with the fields the Zod schema declares', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SampleController],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const schema =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document.paths['/sample']?.get?.responses?.['200'] as any)?.content?.[
        'application/json'
      ]?.schema;

    expect(Object.keys(schema.properties)).toEqual(
      Object.keys(SampleSchema.shape),
    );

    await app.close();
  });
});
