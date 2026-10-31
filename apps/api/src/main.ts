import './instrument';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AppConfig } from './config/app-config.service';
import { configureApp } from './configure-app';
import { RedisIoAdapter } from './infra/realtime/redis-io.adapter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(AppConfig);

  app.useLogger(app.get(Logger));
  configureApp(app);
  app.useWebSocketAdapter(new RedisIoAdapter(app, config.get('CORS_ORIGINS')));
  app.enableShutdownHooks();

  await app.listen(config.get('PORT'));
}

void bootstrap();
