import { Module } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';
import { HttpModule } from '@nestjs/axios';
import { HolidayRepository } from '@src/modules/holiday/repository/holiday.repository';
import { OpenApiHolidayService } from '@src/modules/holiday/open-api-holiday.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Holiday])],
  controllers: [HolidayController],
  providers: [HolidayService, HolidayRepository, OpenApiHolidayService],
  exports: [HolidayService],
})
export class HolidayModule {}
