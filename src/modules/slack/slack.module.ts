import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackInteractiveService } from '@src/modules/slack/service/slack.interactive.service';
import { SlackEventService } from '@src/modules/slack/service/slack.event.service';
import { ConfigModule } from '@nestjs/config';
import { OpenaiModule } from '@lib/openai';
import { UserModule } from '@src/modules/user/user.module';
import { OnlineDatabaseInterfaceModule } from '@lib/online-database-interface';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    OnlineDatabaseInterfaceModule.register(),
    OpenaiModule.register({
      secret_key: process.env.OPENAI_API_KEY,
      organization_id: process.env.OPENAI_ORGANIZATION_ID,
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [SlackController],
  providers: [SlackInteractiveService, SlackEventService],
  exports: [SlackEventService, SlackInteractiveService],
})
export class SlackModule {}
