import { Test, TestingModule } from '@nestjs/testing';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';

describe('HolidayController', () => {
  let controller: HolidayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HolidayController],
      providers: [HolidayService],
    }).compile();

    controller = module.get<HolidayController>(HolidayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
