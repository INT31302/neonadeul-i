import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { SlackEventDto } from '@src/modules/slack/dto/slack-event.dto';
import {
  isBot,
  isDMChannel,
  jvent,
  postMessage,
  setHome,
} from '@src/modules/slack/slack.util';
import { ConfigService } from '@nestjs/config';
import { AppConfigKey, AppConfigs } from '@src/config/app.config';

const logger: Logger = new Logger('MAIN');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  Sentry.init({ dsn: process.env.SENTRY_DSN });

  const slackKey = process.env.SIGNING_SECRET;
  const botAccessToken = process.env.BOT_USER_OAUTH_ACCESS_TOKEN;
  const slackEventAdapter = createEventAdapter(slackKey);
  const webClient = new WebClient(botAccessToken);

  slackEventAdapter.on('message', async (event: SlackEventDto) => {
    if (isDMChannel(event)) return;
    if (isBot(event)) return;
    if (event.text && event.text.includes('제리'))
      return await jvent(webClient, event);
    await postMessage(
      webClient,
      event.channel,
      '안녕하세요! 너나들이의 자세한 내용은 좌측 상단의 홈 탭을 참고해주세요!',
    );
  });
  slackEventAdapter.on('app_home_opened', async (event: SlackEventDto) => {
    await setHome(webClient, event);
  });

  app.use('/slack/events', slackEventAdapter.requestListener());

  const configService = app.get<ConfigService>(ConfigService);

  const appConfig = configService.get<AppConfigs>(AppConfigKey);

  app.useLogger(
    appConfig.isProduction === true
      ? ['log', 'warn', 'error']
      : ['log', 'warn', 'error', 'debug', 'verbose'],
  );

  if (appConfig.isProduction)
    app.useGlobalInterceptors(new SentryInterceptor());
  await app.listen(3000);
}

(async () => {
  await bootstrap();
})();
