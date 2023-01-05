import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/modules/user/entities/user.entity';
import { NotionModule } from '@lib/notion';
import { SlackInteractiveService } from '@src/modules/slack/slack.interactive.service';
import { SlackEventService } from '@src/modules/slack/slack.event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotionModule.register({ notionToken: process.env.NOTION_TOKEN, easterEggDataBaseId: process.env.EASTER_EGG_DB }),
  ],
  controllers: [SlackController],
  providers: [SlackInteractiveService, SlackEventService],
})
export class SlackModule {}
