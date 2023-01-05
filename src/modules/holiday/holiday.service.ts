import { Injectable, Logger } from '@nestjs/common';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import * as dayjs from 'dayjs';
import { Connection } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { HolidayType } from '@src/modules/holiday/holiday.type';
import { HolidayRepository } from '@src/modules/holiday/repository/holiday.repository';

@Injectable()
export class HolidayService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly connection: Connection,
    private readonly holidayRepository: HolidayRepository,
  ) {}

  private async startTransaction() {
    const queryRunner = await this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }

  async create() {
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
    return 'This action adds a new holiday';
  }

  findAll() {
    return `This action returns all holiday`;
  }

  findOne(id: number) {
    return `This action returns a #${id} holiday`;
  }

  update(id: number, updateHolidayDto: UpdateHolidayDto) {
    return `This action updates a #${id} holiday`;
  }

  remove(id: number) {
    return `This action removes a #${id} holiday`;
  }
}
