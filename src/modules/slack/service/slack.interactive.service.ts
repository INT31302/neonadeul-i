import { Injectable, Logger } from '@nestjs/common';
import { createHomeTemplate } from '@src/modules/slack/slack.util';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ChatPostMessageResponse,
  ChatUpdateResponse,
  ViewsPublishArguments,
  ViewsPublishResponse,
} from '@slack/web-api';
import { User } from '@src/modules/user/entities/user.entity';
import { InjectSlackClient, SlackClient } from '@int31302/nestjs-slack-listener';
import * as dayjs from 'dayjs';
import { UserService } from '@src/modules/user/user.service';
import { OnlineDatabaseInterfaceService } from '@lib/online-database-interface';
import { ACTION_ID } from '@src/modules/slack/slack.constants';

@Injectable()
export class SlackInteractiveService {
  private readonly logger: Logger = new Logger(this.constructor.name);
  constructor(
    private readonly userService: UserService,
    private readonly onlineDatabaseInterfaceService: OnlineDatabaseInterfaceService,
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
      const result = await this.slack.chat.postMessage({
        text: message,
        channel,
      });
      if (!result.ok) {
        await this.postErrorMessage(channel);
        new Error(result.error);
      }
      return result;
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
      this.logger.error('메시지 업데이트 중 문제가 발생했습니다.');
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
   * 메시지 수신 시간 변경
   * @param userId
   * @param selectedTime
   */
  async setTime(userId: string, selectedTime: string): Promise<ChatPostMessageResponse> {
    const user = await this.userService.setTime(userId, selectedTime);
    this.logger.log(`${user.name} 메시지 수신 시간 변경 (${selectedTime})`);
    return await this.postMessage(user.channelId, `메시지 수신 시간을 변경되었습니다. (${selectedTime})`);
  }

  /**
   * 구독 업데이트
   * 구독 해제 시 app_home 초기화
   * @param userId
   * @param actionId
   */
  async updateSubscribeStatus(
    userId: string,
    actionId: ACTION_ID.SUBSCRIBE | ACTION_ID.UNSUBSCRIBE,
  ): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    let message: string;
    let homeTemplate: ViewsPublishArguments;
    if (actionId === ACTION_ID.SUBSCRIBE) {
      await this.userService.updateSubscribe(user, true);
      this.logger.log(`${user.name} 구독 완료`);
      message = `${user.name} 어서오세요. 정상적으로 등록이 완료되었습니다.🥰`;
      homeTemplate = this.createView(user);
    } else {
      if (!user || !user.isSubscribe) {
        return this.postMessage(user.channelId, '삭제 가능한 유저 정보가 없어요.');
      }
      await this.userService.updateSubscribe(user, false);
      this.logger.log(`${user.name} 구독 취소`);
      message = `${user.name}, 아쉽지만 다음에 또 봬요.😌`;
      homeTemplate = createHomeTemplate(user.id, '11:00', false, 0, 0, 0, false);
    }
    await this.publishView(homeTemplate);
    return this.postMessage(user.channelId, message);
  }

  /**
   * 현대인 어록 구독 업데이트
   * @param userId
   * @param actionId
   */
  async updateModernSubscribeStatus(
    userId: string,
    actionId: ACTION_ID.MODERN_TEXT_ON | ACTION_ID.MODERN_TEXT_OFF,
  ): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(userId);
    let message: string;
    if (actionId === ACTION_ID.MODERN_TEXT_ON) {
      await this.userService.updateModernSubscribe(user, true);
      this.logger.log(`${user.name} 현대인 글귀 구독 완료`);
      message = '현대인 글귀 구독 상태가 수신 상태로 변경 됐어요!';
    } else {
      await this.userService.updateModernSubscribe(user, false);
      this.logger.log(`${user.name} 현대인 글귀 구독 취소`);
      message = '현대인 글귀 구독 상태가 미수신 상태로 변경 됐어요!';
    }
    await this.publishView(this.createView(user));
    return this.postMessage(user.channelId, message);
  }

  /**
   * 카테고리 선호도 값 변경
   * @param userId
   * @param categoryType
   * @param value
   */
  async updatePreference(userId: string, categoryType: CategoryType, value: number): Promise<ChatPostMessageResponse> {
    const user = await this.userService.updatePreference(userId, categoryType, value);
    this.logger.log(`${user.name} 카테고리 선호도 값 변경(카테고리: ${CategoryType[categoryType]}, 값: ${value})`);
    await this.publishView(this.createView(user));
    return this.postMessage(user.channelId, `${CategoryType[categoryType]} 카테고리 선호도 값이 수정되었습니다.`);
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
      user.isModernText,
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
    await this.onlineDatabaseInterfaceService.createSuggestRecord(dayjs().toISOString(), message, categoryType);
    return this.postMessage(user.channelId, `${user.name}. 소중한 글귀 추천 감사해요!`);
  }
}
