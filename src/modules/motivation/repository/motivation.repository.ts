import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';

@Injectable()
export class MotivationRepository extends Repository<Motivation> {
  constructor(dataSource: DataSource) {
    super(Motivation, dataSource.createEntityManager());
  }
}
