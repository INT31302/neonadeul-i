import { Module } from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SlackModule } from '@src/modules/slack/slack.module';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import { User } from '@src/modules/user/entities/user.entity';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Motivation, Holiday]), HttpModule, SlackModule],
  providers: [MotivationService],
})
export class MotivationModule {}
