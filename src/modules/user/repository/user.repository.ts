import { DataSource, EntityRepository, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '@src/modules/user/entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }
}
