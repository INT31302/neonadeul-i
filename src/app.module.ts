import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import DatabaseModule from '@src/modules/database/database.module';
import { UserModule } from '@src/modules/user/user.module';
import { SlackModule } from '@src/modules/slack/slack.module';
import { MotivationModule } from '@src/modules/motivation/motivation.module';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { HolidayModule } from '@src/modules/holiday/holiday.module';
import ConfigModule from '@src/config/config.module';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '@src/filter/http-exception.filter';
import { SlackModule as SlackListenerModule } from '@int31302/nestjs-slack-listener';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UserModule,
    SlackModule,
    SlackListenerModule.forRootAsync({
      useFactory: async () => ({
        botToken: process.env.BOT_USER_OAUTH_ACCESS_TOKEN,
      }),
    }),
    MotivationModule,
    HttpModule,
    ScheduleModule.forRoot(),
    HolidayModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
