import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';

@Injectable()
export class HolidayRepository extends Repository<Holiday> {
  constructor(private dataSource: DataSource) {
    super(Holiday, dataSource.createEntityManager());
  }
}
