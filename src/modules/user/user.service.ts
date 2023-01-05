import { Injectable, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { User } from '@src/modules/user/entities/user.entity';
import { UserRepository } from '@src/modules/user/repository/user.repository';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(private readonly userRepository: UserRepository) {}

  /**
   * 사용자 정보를 생성합니다.
   * @param name
   */
  create(name: string): Promise<User> {
    this.logger.debug(`create(name: ${name})`);
    return this.userRepository.save({
      name,
      createdAt: dayjs(),
    });
  }

  /**
   * 모든 사용자 목록을 조회합니다.
   */
  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * 사용자 정보를 조회합니다.
   * @param id
   */
  findOne(id: string): Promise<User> {
    return this.userRepository.findOneBy({ id });
  }

  /**
   * 사용자 정보를 제거합니다.
   * @param id
   */
  async remove(id: string): Promise<boolean> {
    const entity = await this.userRepository.findOneByOrFail({ id });
    await this.userRepository.softRemove(entity);
    return true;
  }
}
