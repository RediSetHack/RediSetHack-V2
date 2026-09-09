import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FeaturesModule } from './modules/features.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FeaturesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
