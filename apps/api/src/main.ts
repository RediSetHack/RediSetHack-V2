import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupSwagger } from './swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  app.enableCors({ origin: 'http://localhost:3000' });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const nodeEnv =
    configService.get<string>('NODE_ENV') ??
    process.env.NODE_ENV ??
    'development';
  const isDevelopment = nodeEnv === 'development';

  if (isDevelopment) {
    setupSwagger(app);
  }

  const port = configService.get<number>('PORT') ?? process.env.PORT ?? 3001;
  await app.listen(port);

  Logger.log(
    `Application running in ${nodeEnv} mode on port ${port}`,
    'Bootstrap',
  );
  if (isDevelopment) {
    Logger.log(
      `Swagger documentation available at http://localhost:${port}/docs`,
      'Bootstrap',
    );
  }
}
await bootstrap();