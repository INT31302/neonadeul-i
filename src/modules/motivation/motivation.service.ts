import { Injectable, Logger } from '@nestjs/common';
import { User } from '@src/modules/user/entities/user.entity';
import { Motivation } from '@src/modules/motivation/entities/motivation.entity';
import * as dayjs from 'dayjs';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlackInteractiveService } from '@src/modules/slack/slack.interactive.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotionService } from '@lib/notion';
import { UserService } from '@src/modules/user/user.service';
import { HolidayService } from '@src/modules/holiday/holiday.service';

@Injectable()
export class MotivationService {
  private readonly logger: Logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(Motivation) private motivationRepository: Repository<Motivation>,
    private readonly userService: UserService,
    private readonly holidayService: HolidayService,
    private readonly slackInteractiveService: SlackInteractiveService,
    private readonly notionService: NotionService,
  ) {}

  /**
   *
   * @private
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Seoul',
  })
  private async createConfirmMotivation() {
    try {
      const response = await this.notionService.searchConfirmMotivation();

      if (response.results.length === 0) {
        this.logger.log('승인된 추천 글귀가 없습니다.');
        return;
      }

      const makeEntityList = (resultList) => {
        return resultList.map((data) => {
          return this.motivationRepository.create({
            contents: data['properties']['글귀']['rich_text'][0]['plain_text'],
            category: CategoryType[data['properties']['카테고리']['select']['name'] as string],
          });
        });
      };

      const entityList: Motivation[] = makeEntityList(response.results);
      await this.motivationRepository.save(entityList);
      this.logger.log(`추천 글귀 추가 성공 (data:${JSON.stringify(entityList)})`);
      await this.notionService.updateMotivationPage(response);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error('추천 글귀 추가 과정 중 문제가 발생했습니다.');
        throw e;
      }
    }
  }

  /**
   * 평일 기준 10분마다 메시지 수신 대상자에 글귀 메시지를 발송합니다.
   * 지정한 공휴일의 경우 발송하지 않습니다.
   * @private
   */
  @Cron('*/10 * * * 1-5', {
    timeZone: 'Asia/Seoul',
  })
  private async sendMotivation(): Promise<void> {
    try {
      const holiday = await this.holidayService.findOne(dayjs().format('YYYYMMDD'));
      if (holiday) {
        this.logger.log('공휴일이기 때문에 메시지 발송을 종료합니다.');
      }
      const time = dayjs().format('HH:mm');
      this.logger.log(`메시지 수신 대상자를 조회합니다. (${time})`);
      const userList = await this.userService.findSubscriberOnPushTime(time);
      if (userList.length === 0) {
        this.logger.log(`메시지 수신 대상자가 없습니다. (${time})`);
        return;
      }
      this.logger.log(`${userList.length}명의 메시지 수신 대상자가 존재합니다. (${time})`);
      const motivationList = await this.motivationRepository.find();
      let count = 0;
      userList.map(async (user) => {
        const candidates = this.weightedRandom(user);
        const category = this.getRandomCategory(candidates);
        const motivation = await this.getMotivation(motivationList, category, user.modernText);
        count++;
        await this.slackInteractiveService.postMessage(
          user.channelId,
          `${user.name}. 오늘의 메시지가 도착했어요. 오늘 하루도 힘내세요!
>>>${motivation.contents}`,
        );
      });
      if (count > 0) this.logger.log(`${count}명에게 메시지 전송 완료. (${time})`);
      // 이벤트 종료
      // await this.sendEventMessage();
    } catch (e) {
      if (e instanceof Error) this.logger.error('글귀 발송 과정 중 문제가 발생했습니다.');
      throw e;
    }
  }

  /**
   * 유저의 선호도 기반으로 가중치를 계산합니다.
   * @param user
   * @private
   */
  private weightedRandom(user: User): Map<CategoryType, number> {
    const target = new Map<CategoryType, number>();
    target.set(CategoryType['동기부여'], user.motivation);
    target.set(CategoryType['응원'], user.cheering);
    target.set(CategoryType['위로'], user.consolation);
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

  /**
   * 가중치 기반으로 카테고리를 선정합니다.
   * @param candidates
   * @private
   */
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

  /**
   * 각 유저별 선정된 카테고리 기반으로 글귀를 필터링 후 랜덤으로 글귀를 선정합니다.
   * 현대인 글귀는 필수로 포함됩니다.
   * @param motivationList
   * @param category
   * @param modernText
   * @private
   */
  private async getMotivation(motivationList: Motivation[], category: CategoryType, modernText: boolean) {
    const motivations = motivationList.filter((item) => item.category === category);
    if (modernText) motivations.push(...motivations.filter((item) => item.category === CategoryType['기타']));
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  // 이벤트 종료
  // /**
  //  * 1주년 메시지 발송
  //  * 2023-01-13 11:00 기준 구독자에게 전체 발송
  // private async sendEventMessage() {
  //   const now = dayjs();
  //   if (now.year() === 2023 && now.month() === 0 && now.date() === 13 && now.hour() === 11 && now.minute() === 0) {
  //     const message = await this.notionService.searchEasterEgg(process.env.FIRST_YEAR_MESSAGE);
  //
  //     const userList = await this.userRepository.find({
  //       where: { isSubscribe: true },
  //     });
  //     userList.map(async (user) => {
  //       let newMessage = message.replace(/\${name}/gi, user.name);
  //       newMessage = newMessage.replace(/\${josa}/gi, isEndWithConsonant(user.name) ? '을' : '를');
  //       try {
  //         await this.slackInteractiveService.postMessage(user.channelId, newMessage);
  //       } catch (e) {
  //         this.logger.error(`${user.name} 오류`);
  //         throw e;
  //       }
  //     });
  //   }
  // }*/
}
