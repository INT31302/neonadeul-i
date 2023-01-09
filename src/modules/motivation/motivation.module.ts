import { Module } from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SlackModule } from '@src/modules/slack/slack.module';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import { User } from '@src/modules/user/entities/user.entity';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';
import { NotionModule } from '@lib/notion';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([User, Motivation, Holiday]),
    HttpModule,
    SlackModule,
    NotionModule.register({
      notionToken: process.env.NOTION_TOKEN,
      easterEggDataBaseId: process.env.EASTER_EGG_DB,
    }),
  ],
  providers: [MotivationService],
})
export class MotivationModule {}
