import { Holiday } from '@src/modules/holiday/entities/holiday.entity';
import { DataSource, InsertResult, Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { HolidayType } from '@src/modules/holiday/holiday.type';

@Injectable()
export class HolidayRepository extends Repository<Holiday> {
  private readonly logger: Logger = new Logger(this.constructor.name);
  constructor(private readonly dataSource: DataSource) {
    const baseRepository = dataSource.getRepository(Holiday);
    super(baseRepository.target, baseRepository.manager, baseRepository.queryRunner);
  }

  /**
   * DB 에 저장하기 위한 HolidayEntity[] 생성
   * openapi 를 통해서 조회한 데이터를 HolidayEntity 로 변환합니다.
   * 9월 1일 창립기념일 대응하기 위해 코드 추가
   * @param items
   * @param year
   */
  private createEntities(items: HolidayType[], year: number) {
    const holidayEntities = items.map((item) =>
      this.create({
        name: item.dateName,
        date: item.locdate.toString(),
      }),
    );
    // 창립기념일 대응 코드 추가
    this.pushFoundingDay(holidayEntities, year);
    return holidayEntities;
  }

  /**
   * 창립기념일에는 메시지를 발송하지 않습니다.
   * @param holidayEntities
   * @param year
   * @private
   */
  private pushFoundingDay(holidayEntities: Holiday[], year: number): void {
    holidayEntities.push(this.create({ name: '창립기념일', date: `${year}0901` }));
  }

  /**
   *
   * @param items
   * @param year
   */
  async saveItems(items: HolidayType[], year: number): Promise<InsertResult> {
    const insertResult = await this.upsert(this.createEntities(items, year), {
      conflictPaths: ['date'],
      skipUpdateIfNoValuesChanged: true,
    });
    this.logger.log(`${year}년 공휴일 정보를 저장했습니다.`);
    return insertResult;
  }
}
