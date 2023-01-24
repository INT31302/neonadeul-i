import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackInteractiveService } from '@src/modules/slack/slack.interactive.service';
import { SlackEventService } from '@src/modules/slack/slack.event.service';
import { ConfigModule } from '@nestjs/config';
import { OpenaiModule } from '@lib/openai';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserModule } from '@src/modules/user/user.module';
import { AirtableModule } from '@lib/airtable';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    AirtableModule.register({ apiKey: process.env.AIRTABLE_API_KEY, base: process.env.AIRTABLE_BASE }),
    /*NotionModule.register({
      notionToken: process.env.NOTION_TOKEN,
      easterEggDataBaseId: process.env.EASTER_EGG_DB,
      motivationSuggestDataBaseId: process.env.MOTIVATION_SUGGEST_DB,
    }),*/
    OpenaiModule.register({
      secret_key: process.env.OPENAI_API_KEY,
      organization_id: process.env.OPENAI_ORGANIZATION_ID,
    }),
    ClientsModule.register([
      {
        name: 'REDIS',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          username: process.env.REDIS_USER,
          password: process.env.REDIS_PASSWORD,
        },
      },
    ]),
  ],
  controllers: [SlackController],
  providers: [SlackInteractiveService, SlackEventService],
  exports: [SlackEventService, SlackInteractiveService],
})
export class SlackModule {}
