import { Controller, Post } from '@nestjs/common';
import { HolidayService } from '@src/modules/holiday/holiday.service';

@Controller('holiday')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  create() {
    return this.holidayService.create();
  }
}
