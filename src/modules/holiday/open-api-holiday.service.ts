import { HttpService } from '@nestjs/axios';
import { HolidayType, OpenApiHolidayResponseType } from '@src/modules/holiday/holiday.type';
import { lastValueFrom } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenApiHolidayService {
  private readonly logger: Logger = new Logger(this.constructor.name);
  private readonly serviceKey: string;
  private retryAttempt: number;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.serviceKey = this.configService.get<string>('HOLIDAY_API_KEY');
    this.resetRetryAttempt();
  }

  /**
   * openapi 를 통해 해당년도의 공휴일 정보를 불러옵니다.
   * 올바르지 않은 데이터가 조회될 경우 불러올 때까지 재요청합니다.
   * @param year
   */
  async get(year: number): Promise<HolidayType[]> {
    const response = await lastValueFrom(
      this.httpService.get<OpenApiHolidayResponseType>(
        `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${year}&ServiceKey=${this.serviceKey}&numOfRows=100&_type=json`,
      ),
    );
    this.incrementRetryAttempt();

    if (!(response.data instanceof Object)) {
      if (this.retryAttempt === 5) {
        this.logger.error('재시도 횟수가 5회를 초과하여 공휴일 정보 조회를 중단합니다.');
        this.resetRetryAttempt();
        return;
      }
      this.logger.error('공휴일 정보를 불러오지 못했습니다. 다시 불러옵니다.');
      // 공휴일 정보 등록될 때까지 재실행
      return await this.get(year);
    }
    this.resetRetryAttempt();
    return response.data.response.body.items.item;
  }

  /**
   * 재시도 횟수를 증가한다.
   * @private
   */
  private incrementRetryAttempt() {
    this.retryAttempt++;
  }

  /**
   * 재시도 횟수를 초기화 한다.
   * @private
   */
  private resetRetryAttempt() {
    this.retryAttempt = 0;
  }
}
