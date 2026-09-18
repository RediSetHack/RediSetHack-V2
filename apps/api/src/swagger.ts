import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function shouldServeDocs(nodeEnv: string): boolean {
  return nodeEnv !== 'production';
}

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('RediSetHack API')
    .setDescription('RediSetHack V2 REST API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  return document;
}
