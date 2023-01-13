import { Module } from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SlackModule } from '@src/modules/slack/slack.module';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import { NotionModule } from '@lib/notion';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '@src/modules/user/user.module';
import { HolidayModule } from '@src/modules/holiday/holiday.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Motivation]),
    UserModule,
    HolidayModule,
    HttpModule,
    SlackModule,
    NotionModule.register({
      notionToken: process.env.NOTION_TOKEN,
      easterEggDataBaseId: process.env.EASTER_EGG_DB,
      motivationSuggestDataBaseId: process.env.MOTIVATION_SUGGEST_DB,
    }),
  ],
  providers: [MotivationService],
  exports: [MotivationService],
})
export class MotivationModule {}
