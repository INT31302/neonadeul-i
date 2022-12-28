import { Module } from '@nestjs/common';
import { SlackController } from './slack.controller';
import { SlackService } from '@src/modules/slack/slack.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/modules/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [SlackController],
  providers: [SlackService],
})
export class SlackModule {}
