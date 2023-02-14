import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackInteractiveService } from '@src/modules/slack/service/slack.interactive.service';
import { SlackEventService } from '@src/modules/slack/service/slack.event.service';
import { ConfigModule } from '@nestjs/config';
import { OpenaiModule } from '@lib/openai';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserModule } from '@src/modules/user/user.module';
import { OnlineDatabaseInterfaceModule } from '@lib/online-database-interface';
@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    OnlineDatabaseInterfaceModule.register(),
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
