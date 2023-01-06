import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { ConfigService } from '@nestjs/config';
import { AppConfigKey, AppConfigs } from '@src/config/app.config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

const logger: Logger = new Logger('MAIN');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      retryAttempts: 5,
      retryDelay: 3000,
    },
  });
  Sentry.init({ dsn: process.env.SENTRY_DSN });

  const configService = app.get<ConfigService>(ConfigService);

  const appConfig = configService.get<AppConfigs>(AppConfigKey);

  app.useLogger(
    appConfig.isProduction === true ? ['log', 'warn', 'error'] : ['log', 'warn', 'error', 'debug', 'verbose'],
  );

  await app.startAllMicroservices();
  if (appConfig.isProduction) app.useGlobalInterceptors(new SentryInterceptor());
  await app.listen(process.env.PORT || 3000);
}

(async () => {
  await bootstrap();
})();
