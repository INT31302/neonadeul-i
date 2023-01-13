import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { DataSource, Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { HolidayType } from '@src/modules/holiday/holiday.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class HolidayService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
    @InjectRepository(Holiday) private holidayRepository: Repository<Holiday>,
  ) {}

  private async startTransaction() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }

  /**
   * 1년에 한번씩 공휴일 저장
   */
  @Cron(CronExpression.EVERY_YEAR, {
    timeZone: 'Asia/Seoul',
  })
  async create(): Promise<void> {
    const year = dayjs().year();
    const serviceKey = process.env.HOLIDAY_API_KEY;
    const items: HolidayType[] = await lastValueFrom(
      this.httpService.get(
        `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${year}&ServiceKey=${serviceKey}&numOfRows=100&_type=json`,
      ),
    ).then((value) => value.data.response.body.items.item);
    const queryRunner = await this.startTransaction();
    try {
      const holidayEntities = items.map((item) =>
        this.holidayRepository.create({
          name: item.dateName,
          date: item.locdate.toString(),
        }),
      );
      await queryRunner.manager.save(holidayEntities);
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
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
