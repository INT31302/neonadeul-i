import { Injectable, Logger } from '@nestjs/common';
import { User } from '@src/modules/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeepPartial } from 'typeorm/common/DeepPartial';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  /**
   * 매달 1일 jerry 리셋
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, { timeZone: 'Asia/Seoul' })
  async resetJerry(): Promise<void> {
    await this.userRepository.update({ jerry: true }, { jerry: false });
    this.logger.log('jerry 리셋 완료');
  }
  /**
   * 사용자 정보를 생성합니다.
   * @param user
   */
  save(user: DeepPartial<User>): Promise<User> {
    return this.userRepository.save(user);
  }

  /**
   * 모든 사용자 목록을 조회합니다.
   */
  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   *
   * @param pushTime
   */
  findSubscriberOnPushTime(pushTime: string): Promise<User[]> {
    return this.userRepository.find({
      where: { isSubscribe: true, pushTime },
    });
  }
  /**
   * 미구독 상태의 유저 목록 조회
   */
  findUnSubscriber(): Promise<User[]> {
    return this.userRepository.find({
      where: { isSubscribe: false },
    });
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
   */
  async remove(user: User): Promise<User> {
    return this.userRepository.remove(user);
  }

  /**
   * 사용자 정보 목록을 제거합니다.
   */
  async removeList(userList: User[]): Promise<User[]> {
    return this.userRepository.remove(userList);
  }
}
