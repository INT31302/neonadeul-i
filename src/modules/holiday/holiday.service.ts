import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { HolidayType } from '@src/modules/holiday/holiday.type';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OpenApiHolidayService } from '@src/modules/holiday/open-api-holiday.service';
import { HolidayRepository } from '@src/modules/holiday/repository/holiday.repository';

@Injectable()
export class HolidayService {
  constructor(
    private readonly openApiHolidayService: OpenApiHolidayService,
    private readonly holidayRepository: HolidayRepository,
  ) {}

  /**
   * 1년에 한번씩 공휴일 저장
   */
  @Cron(CronExpression.EVERY_YEAR, {
    timeZone: 'Asia/Seoul',
  })
  async create(): Promise<void> {
    const year = dayjs().year();
    const items: HolidayType[] = await this.openApiHolidayService.get(year);
    await this.holidayRepository.saveItems(items, year);
  }

  /**
   * 일자 기준 공휴일 조회
   * @param date
   */
  findOne(date: string) {
    return this.holidayRepository.findOne({
      where: { date },
    });
  }
}
