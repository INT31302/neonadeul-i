import { Module } from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/modules/user/entities/user.entity';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import { HttpModule } from '@nestjs/axios';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Motivation, Holiday]), HttpModule],
  providers: [MotivationService],
})
export class MotivationModule {}
