import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './presentation/controllers/app.controller.js';
import { AppService } from './application/services/app.service.js';
import { GetHelloUseCase } from './application/use-cases/get-hello.use-case.js';
import { FeaturesModule } from './modules/features.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FeaturesModule],
  controllers: [AppController],
  providers: [GetHelloUseCase, AppService],
})
export class AppModule {}
