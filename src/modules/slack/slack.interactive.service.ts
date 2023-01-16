import { Injectable, Logger } from '@nestjs/common';
import { createHomeTemplate } from '@src/modules/slack/slack.util';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotionService } from '@lib/notion';
import {
  ChatPostMessageResponse,
  ChatUpdateResponse,
  ViewsPublishArguments,
  ViewsPublishResponse,
} from '@slack/web-api';
import { User } from '@src/modules/user/entities/user.entity';
import { InjectSlackClient, SlackClient } from '@int31302/nestjs-slack-listener';
import * as dayjs from 'dayjs';
import { NotionType } from '@lib/notion/notion.type';
import { UserService } from '@src/modules/user/user.service';

@Injectable()
export class SlackInteractiveService {
  private readonly logger: Logger = new Logger(this.constructor.name);
  constructor(
    private readonly userService: UserService,
    private readonly notionService: NotionService,
    @InjectSlackClient()
    private readonly slack: SlackClient,
  ) {}

  /**
   * 구독 해제한 유저 삭제
   * appHome 진입 시 유저를 저장 하기 때문에 따로 삭제 처리
   */
  @Cron(CronExpression.EVERY_HOUR, {
    timeZone: 'Asia/Seoul',
  })
  async cleanUpUser(): Promise<User[]> {
    const userList = await this.userService.findUnSubscriber();
    return await this.userService.removeList(userList);
  }

  /**
   * 메시지 발송
   * @param channel
   * @param message
   */
  async postMessage(channel: string, message: string): Promise<ChatPostMessageResponse> {
    try {
      return await this.slack.chat.postMessage({
        text: message,
        channel,
      });
    } catch (e) {
      this.logger.error('메시지 발송 중 문제가 발생했습니다.');
      throw e;
    }
  }

  /**
   * 메시지 수정
   * @param channel
   * @param message
   * @param ts
   */
  async updateMessage(channel: string, message: string, ts: string): Promise<ChatUpdateResponse> {
    try {
      return await this.slack.chat.update({ text: message, ts, channel });
    } catch (e) {
      this.logger.error('메시지 업데티ㅡ 중 문제가 발생했습니다.');
      throw e;
    }
  }

  /**
   * 에러 메시지 발송
   * @param channelId
   */
  async postErrorMessage(channelId: string): Promise<ChatPostMessageResponse> {
    try {
      return await this.slack.chat.postMessage({
        text: '알 수 없는 오류가 발생하였습니다❗️',
        channel: channelId,
      });
    } catch (e) {
      this.logger.error('에러 메시지 발송 중 문제가 발생했습니다.');
      throw e;
    }
  }

  /**
   * 구독 설정
   * 이미 구독한 경우 별도 메시지 발송
   * @param userId
   */
  async subscribe(userId: string): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    if (user.isSubscribe) {
      return await this.postMessage(user.channelId, '앗! 이미 등록되어 있어요.');
    }
    user.isSubscribe = true;
    await this.userService.save(user);
    this.logger.log(`${user.name} 구독 완료`);
    const homeTemplate = this.createView(user);
    await this.slack.views.publish(homeTemplate);
    const result = await this.postMessage(
      user.channelId,
      `${user.name} 어서오세요. 정상적으로 등록이 완료되었습니다.🥰`,
    );
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }

    return result;
  }

  /**
   * 구독 해제
   * 이미 구독 했거나 구독 하지 않은 경우 별도 메시지 발송
   * app_home 초기화
   * @param userId
   */
  async unsubscribe(userId: string): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    if (!user || !user.isSubscribe) {
      return await this.postMessage(user.channelId, '삭제 가능한 유저 정보가 없어요.');
    }
    const homeTemplate = createHomeTemplate(user.id, '11:00', false, 0, 0, 0, false);
    await this.slack.views.publish(homeTemplate);
    user.isSubscribe = false;
    await this.userService.save(user);
    this.logger.log(`${user.name} 구독 취소`);
    const result = await this.postMessage(user.channelId, `${user.name}, 아쉽지만 다음에 또 봬요.😌`);
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
    return result;
  }

  /**
   * 메시지 수신 시간 변경
   * @param userId
   * @param selectedTime
   */
  async setTime(userId: any, selectedTime: any): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    if (!user) return;
    await this.userService.save({ ...user, pushTime: selectedTime });
    this.logger.log(`${user.name} 메시지 수신 시간 변경 (${selectedTime})`);
    return await this.postMessage(user.channelId, `메시지 수신 시간을 변경되었습니다. (${selectedTime})`);
  }

  /**
   * 현대인 글귀 구독 설정
   * 이미 수신한 경우 별도 메시지 발송
   * @param userId
   */
  async modernOn(userId: string): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    if (user.modernText) {
      return await this.postMessage(user.channelId, '앗! 이미 수신 허용 했어요.');
    }
    user.modernText = true;
    await this.userService.save(user);
    this.logger.log(`${user.name} 현대인 글귀 구독 완료`);
    const homeTemplate = this.createView(user);
    await this.publishView(homeTemplate);
    const result = await this.postMessage(user.channelId, `현대인 글귀 구독 상태가 수신 상태로 변경 됐어요!`);
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
    return result;
  }

  /**
   * 현대인 글귀 수신 거부
   * 이미 수신 거부한 경우 별도 메시지 발송
   * @param userId
   */
  async modernOff(userId: string): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    if (!user.modernText) {
      return await this.postMessage(user.channelId, '앗! 이미 수신 거부 했어요.');
    }
    user.modernText = false;
    await this.userService.save(user);
    this.logger.log(`${user.name} 현대인 글귀 구독 취소`);
    const homeTemplate = this.createView(user);
    await this.publishView(homeTemplate);
    const result = await this.postMessage(user.channelId, `현대인 글귀 구독 상태가 미수신 상태로 변경 됐어요!`);
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
    return result;
  }

  /**
   * 카테고리 선호도 값 변경
   * @param userId
   * @param categoryType
   * @param value
   */
  async updatePreference(userId: string, categoryType: CategoryType, value: number): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    switch (categoryType) {
      case CategoryType.동기부여:
        user.motivation = value;
        break;
      case CategoryType.응원:
        user.cheering = value;
        break;
      case CategoryType.위로:
        user.consolation = value;
        break;
    }
    await this.userService.save(user);
    this.logger.log(`${user.name} 카테고리 선호도 값 변경(카테고리: ${CategoryType[categoryType]}, 값: ${value})`);
    await this.publishView(this.createView(user));
    const result = await this.postMessage(
      user.channelId,
      `${CategoryType[categoryType]} 카테고리 선호도 값이 수정되었습니다.`,
    );
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
    return result;
  }

  /**
   * 유저 정보에 대한 appHomeView 생성
   * @param user
   * @private
   */
  createView(user: User): ViewsPublishArguments {
    return createHomeTemplate(
      user.id,
      user.pushTime,
      user.isSubscribe,
      user.cheering,
      user.motivation,
      user.consolation,
      user.modernText,
    );
  }

  /**
   * slack bot 에 view publish
   * @param view
   * @private
   */
  async publishView(view: ViewsPublishArguments): Promise<ViewsPublishResponse> {
    return await this.slack.views.publish(view);
  }

  /**
   * 추천 글귀 요청이 왔을 경우 Notion DB에 추가
   * @param userId
   * @param message
   * @param category
   */
  async onMessageSuggest(userId: string, message: string, category: string) {
    const user = await this.userService.findOne(userId);
    const categoryType =
      category === 'motivation'
        ? CategoryType['동기부여']
        : category === 'cheering'
        ? CategoryType['응원']
        : category === 'consolation'
        ? CategoryType['위로']
        : CategoryType['기타'];
    await this.notionService.createPage(
      dayjs().format('YYYY-MM-DD HH:mm:ss'),
      message,
      categoryType,
      NotionType.SUGGEST,
    );
    const result = await this.postMessage(user.channelId, `${user.name}. 소중한 글귀 추천 감사해요!`);
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
    return result;
  }
}
