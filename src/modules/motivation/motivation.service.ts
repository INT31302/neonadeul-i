import { Injectable, Logger } from '@nestjs/common';
import { ChatPostMessageResponse } from '@slack/web-api';
import { User } from '@src/modules/user/entities/user.entity';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import * as dayjs from 'dayjs';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { Cron } from '@nestjs/schedule';
import { SlackInteractiveService } from '@src/modules/slack/slack.interactive.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from '@src/modules/holiday/entities/holiday.entity';

@Injectable()
export class MotivationService {
  private readonly logger: Logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Motivation) private motivationRepository: Repository<Motivation>,
    @InjectRepository(Holiday) private holidayRepository: Repository<Holiday>,
    private readonly slackInteractiveService: SlackInteractiveService,
  ) {}

  @Cron('*/10 * * * 1-5', {
    timeZone: 'Asia/Seoul',
  })
  private async sendMotivation(): Promise<void> {
    const holiday = await this.holidayRepository.findOne({
      where: { date: dayjs().format('YYYYMMDD') },
    });
    if (holiday) return;
    const userList = await this.userRepository.find({
      where: { isSubscribe: true },
    });
    const motivationList = await this.motivationRepository.find();
    const time = dayjs().format('HH:mm');
    let count = 0;
    userList.map(async (user) => {
      if (time !== user.pushTime) return;
      const candidates = this.weightedRandom(user);
      const category = this.getRandomCategory(candidates);
      const motivation = await this.getMotivation(motivationList, category, user.modernText);
      const contents = motivation.contents;
      count++;
      try {
        await this.postMessage(user.channelId, user.name, contents);
      } catch (e) {
        this.logger.error(`${user.name} 오류`);
        throw e;
      }
    });
    if (count) this.logger.log(`${count}명에게 메시지 전송 완료.`);
  }

  private weightedRandom(user: User): Map<CategoryType, number> {
    const target = new Map<CategoryType, number>();
    target.set(CategoryType.동기부여, user.motivation);
    target.set(CategoryType.응원, user.cheering);
    target.set(CategoryType.위로, user.consolation);
    // 1. 총 가중치 합 계산
    let totalWeight = 0;
    for (const item of target) {
      totalWeight += item[1];
    }
    // 2. 주어진 가중치를 백분율로 치환 (가중치 / 총 가중치)

    const candidates = new Map<CategoryType, number>();
    for (const item of target) {
      candidates.set(item[0], item[1] / totalWeight);
    }

    // 3. 가중치의 오름차순으로 정렬
    const candidatesArray = Array.from(candidates);
    candidatesArray.sort((a, b) => a[1] - b[1]);

    return new Map(candidatesArray);
  }

  private getRandomCategory(candidates: Map<CategoryType, number>): CategoryType {
    // 1. 랜덤 기준점 설정
    const pivot = Math.random();

    // 2. 가중치의 오름차순으로 원소들을 순회하며 가중치를 누적
    let acc = 0;
    for (const item of candidates) {
      acc += item[1];
      if (pivot <= acc) {
        return item[0];
      }
    }
    return null;
  }

  private async getMotivation(motivationList: Motivation[], category: CategoryType, modernText: boolean) {
    const motivations = motivationList.filter((item) => item.category === category);
    if (modernText) motivations.push(...motivations.filter((item) => item.category === CategoryType.기타));
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  private async postMessage(channel: string, name: string, contents): Promise<ChatPostMessageResponse> {
    return await this.slackInteractiveService.postMessage(
      channel,
      `${name}. 오늘의 메시지가 도착했어요. 오늘 하루도 힘내세요!
>${contents}`,
    );
  }
}
