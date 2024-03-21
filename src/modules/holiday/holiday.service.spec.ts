import { HolidayService } from './holiday.service';
import { TestBed } from '@automock/jest';
import { HolidayType } from '@src/modules/holiday/holiday.type';
import { OpenApiHolidayService } from '@src/modules/holiday/open-api-holiday.service';
import { HolidayRepository } from '@src/modules/holiday/repository/holiday.repository';

describe('HolidayService', () => {
  let service: HolidayService;
  let openApiHoliday: jest.Mocked<OpenApiHolidayService>;
  let holidayRepository: jest.Mocked<HolidayRepository>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(HolidayService).compile();
    service = unit;

    openApiHoliday = unitRef.get(OpenApiHolidayService);
    holidayRepository = unitRef.get(HolidayRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('', async () => {
      // given
      const holidayResponseStub: HolidayType[] = [
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
      ];
      jest.spyOn(openApiHoliday, 'get').mockResolvedValueOnce(holidayResponseStub);
      // when
      await service.create();
      // then
    });
  });
});
