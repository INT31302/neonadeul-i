import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { ConfigService } from '@nestjs/config';
import { AppConfigKey, AppConfigs } from '@src/config/app.config';

const logger: Logger = new Logger('MAIN');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  Sentry.init({ dsn: process.env.SENTRY_DSN });

  const configService = app.get<ConfigService>(ConfigService);

  const appConfig = configService.get<AppConfigs>(AppConfigKey);

  app.useLogger(
    appConfig.isProduction === true ? ['log', 'warn', 'error'] : ['log', 'warn', 'error', 'debug', 'verbose'],
  );

  if (appConfig.isProduction) app.useGlobalInterceptors(new SentryInterceptor());
  await app.listen(3000);
}

(async () => {
  await bootstrap();
})();
