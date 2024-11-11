import { Injectable, Logger } from "@nestjs/common";
import { Motivation } from "@src/modules/motivation/entities/motivation.entity";
import * as dayjs from "dayjs";
import { CategoryType } from "@src/modules/motivation/movitation.type";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SlackInteractiveService } from "@src/modules/slack/service/slack.interactive.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserService } from "@src/modules/user/user.service";
import { HolidayService } from "@src/modules/holiday/holiday.service";
import { OnlineDatabaseInterfaceService } from "@lib/online-database-interface";
import { MotivationModel } from "@lib/online-database-interface/online-database-interface.type";
import { CategoryWeight } from "@src/modules/motivation/category.weight";
import { ConfigService } from "@nestjs/config";
import { getRandomNumber } from "@src/modules/common/utils";
import { User } from "@src/modules/user/entities/user.entity";

@Injectable()
export class MotivationService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Motivation) private motivationRepository: Repository<Motivation>,
    private readonly userService: UserService,
    private readonly holidayService: HolidayService,
    private readonly configService: ConfigService,
    private readonly slackInteractiveService: SlackInteractiveService,
    private readonly onlineDatabaseService: OnlineDatabaseInterfaceService
  ) {
  }

  /**
   *
   * @private
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: "Asia/Seoul"
  })
  private async createConfirmMotivation() {
    try {
      const modelList = await this.onlineDatabaseService.searchConfirmMotivation();

      if (modelList.length === 0) {
        this.logger.log("승인된 추천 글귀가 없습니다.");
        return;
      }

      const makeEntityList = (resultList: MotivationModel[]) => {
        return resultList.map(({ contents, category }) => {
          return this.motivationRepository.create({
            contents: contents,
            category: CategoryType[category]
          });
        });
      };

      const entityList: Motivation[] = makeEntityList(modelList);
      await this.motivationRepository.save(entityList);
      this.logger.log(`추천 글귀 추가 성공 (data:${JSON.stringify(entityList)})`);
      await this.onlineDatabaseService.updateMotivationRecord(modelList);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error("추천 글귀 추가 과정 중 문제가 발생했습니다.");
        throw e;
      }
    }
  }

  /**
   * 평일 기준 10분마다 메시지 수신 대상자에 글귀 메시지를 발송합니다.
   * 지정한 공휴일의 경우 발송하지 않습니다.
   * @private
   */
  @Cron("*/10 * * * 1-5", {
    timeZone: "Asia/Seoul"
  })
  private async sendMotivation(): Promise<void> {
    try {
      if (this.configService.get<string>("APP_ENV") !== "prod") {
        this.logger.debug("운영환경이 아니기 때문에 종료합니다.");
        return;
      }

      const holiday = await this.holidayService.findOne(dayjs().format("YYYYMMDD"));
      if (holiday) {
        this.logger.log("공휴일이기 때문에 메시지 발송을 종료합니다.");
        return;
      }

      const time = dayjs().format("HH:mm");
      this.logger.log(`메시지 수신 대상자를 조회합니다. (${time})`);
      const userList = await this.userService.findSubscriberOnPushTime(time);

      if (userList.length === 0) {
        this.logger.log(`메시지 수신 대상자가 없습니다. (${time})`);
        return;
      }

      this.logger.log(`${userList.length}명의 메시지 수신 대상자가 존재합니다. (${time})`);
      const motivationList = await this.motivationRepository.find();

      for (const user of userList) {
        const category = new CategoryWeight(user.motivation, user.cheering, user.consolation).getCategoryByWeight();
        const motivation = await this.getMotivation(motivationList, category, user.isModernText);
        await this.slackInteractiveService.postMessage(
          user.channelId,
          `${user.name}. 오늘의 메시지가 도착했어요. 오늘 하루도 힘내세요!
>>>${motivation.contents}`
        );
        const now = dayjs();
        if (now.year() === 2024 && now.month() === 10 && now.date() === 13 && !user.jerry) {
          await this.slackInteractiveService.postMessage(user.channelId, await this.getServiceClosedMessage(user));
        }
      }
      this.logger.log(`${userList.length}명에게 메시지 전송 완료. (${time})`);
    } catch (e) {
      if (e instanceof Error) this.logger.error("글귀 발송 과정 중 문제가 발생했습니다.");
      throw e;
    }
  }

  /**
   * 각 유저별 선정된 카테고리 기반으로 글귀를 필터링 후 랜덤으로 글귀를 선정합니다.
   * 현대인 글귀는 사용자 옵션에 따라 리스트에 포함하여 랜덤으로 선정합니다.
   * @param motivationList
   * @param category
   * @param isModernText
   * @private
   */
  private async getMotivation(motivationList: Motivation[], category: CategoryType, isModernText: boolean) {
    const filteredMotivationList = motivationList.filter((item) => item.category === category);
    if (isModernText) {
      filteredMotivationList.push(...filteredMotivationList.filter((item) => item.category === CategoryType["기타"]));
    }
    return filteredMotivationList[Math.floor(getRandomNumber() * filteredMotivationList.length)];
  }

  /**
   * 서비스 종료 메시지 발송
   * 2024-11-13 기준 구독자에게 전체 발송
   * */
  private async getServiceClosedMessage(user: User) {
    await this.userService.updateJerry(user.id);
    const message = await this.onlineDatabaseService.searchEasterEgg("서비스 종료");
    return message.replace(/\${name}/gi, user.name);
  }
}
