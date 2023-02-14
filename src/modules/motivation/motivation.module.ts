import { Module } from '@nestjs/common';
import { MotivationService } from './motivation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackModule } from '@src/modules/slack/slack.module';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import { UserModule } from '@src/modules/user/user.module';
import { HolidayModule } from '@src/modules/holiday/holiday.module';
import { OnlineDatabaseInterfaceModule } from '@lib/online-database-interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Motivation]),
    UserModule,
    HolidayModule,
    SlackModule,
    OnlineDatabaseInterfaceModule.register(),
  ],
  providers: [MotivationService],
  exports: [MotivationService],
})
export class MotivationModule {}
