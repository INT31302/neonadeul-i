import { Module } from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/modules/user/entities/user.entity';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import { HttpModule } from '@nestjs/axios';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';
import { SlackModule } from '@src/modules/slack/slack.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Motivation, Holiday]), HttpModule, SlackModule],
  providers: [MotivationService],
})
export class MotivationModule {}
