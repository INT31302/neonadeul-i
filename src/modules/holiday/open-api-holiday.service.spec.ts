import { OpenApiHolidayService } from '@src/modules/holiday/open-api-holiday.service';
import { ConfigService } from '@nestjs/config';
import { TestBed } from '@automock/jest';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { HolidayType, OpenApiHolidayResponseType } from '@src/modules/holiday/holiday.type';

function isHolidayType(value: any): value is HolidayType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dateKind' in value &&
    typeof value.dateKind === 'string' &&
    'dateName' in value &&
    typeof value.dateName === 'string' &&
    'isHoliday' in value &&
    typeof value.isHoliday === 'string' &&
    'locdate' in value &&
    typeof value.locdate === 'number' &&
    'seq' in value &&
    typeof value.seq === 'number'
  );
}

expect.extend({
  toBeHolidayType(received: any) {
    const pass = isHolidayType(received);
    const message = pass ? `Expected ${received} not to be a HolidayType` : `Expected ${received} to be a HolidayType`;
    return { pass, message: () => message };
  },
});

describe('OpenApiHolidayService', () => {
  let service: OpenApiHolidayService;
  let httpService: jest.Mocked<HttpService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(OpenApiHolidayService).compile();
    service = unit;
    httpService = unitRef.get(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('get', () => {
    it('공휴일 정보를 정상적으로 조회한 경우 HolidayType 이어야 한다.', async () => {
      // given
      const year = 2024;
      const openApiHolidayResponseStub = {
        data: {
          response: {
            body: {
              items: {
                item: [
                  {
                    dateKind: '01',
                    dateName: '1월1일',
                    isHoliday: 'Y',
                    locdate: 20240101,
                    seq: 1,
                  },
                  {
                    dateKind: '01',
                    dateName: '설날',
                    isHoliday: 'Y',
                    locdate: 20240209,
                    seq: 1,
                  },
                  {
                    dateKind: '01',
                    dateName: '설날',
                    isHoliday: 'Y',
                    locdate: 20240210,
                    seq: 1,
                  },
                ],
              },
              numOfRows: 100,
              pageNo: 1,
              totalCount: 3,
            },
            header: { resultCode: '', resultMsg: '' },
          },
        } as OpenApiHolidayResponseType,
        status: 200,
        statusText: 'ok',
        headers: {},
        config: {},
      };
      jest.spyOn(httpService, 'get').mockReturnValue(of(openApiHolidayResponseStub));

      // when
      const actual = await service.get(year);

      // then
      expect(actual).toMatchObject(openApiHolidayResponseStub.data.response.body.items.item);
      expect(isHolidayType(actual[0])).toBeTruthy();
    });
    it('공휴일 정보 조회에 실패했을 경우 재시도 횟수를 포함하여 5회까지 시도합니다.', async () => {
      // given
      const year = 2024;
      const openApiHolidayResponseStub = { data: null, status: 200, statusText: 'ok', headers: {}, config: {} };
      const spyInstance = jest.spyOn(httpService, 'get').mockReturnValue(of(openApiHolidayResponseStub));

      // when
      await service.get(year);

      // then
      expect(spyInstance).toHaveBeenCalledTimes(5);
    });
  });
});
