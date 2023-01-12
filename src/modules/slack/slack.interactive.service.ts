import { Injectable, Logger } from '@nestjs/common';
import { createHomeTemplate } from '@src/modules/slack/slack.util';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotionService } from '@lib/notion';
import { ChatPostMessageResponse, ViewsPublishArguments, ViewsPublishResponse } from '@slack/web-api';
import { User } from '@src/modules/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectSlackClient, SlackClient } from '@int31302/nestjs-slack-listener';
import * as dayjs from 'dayjs';
import { NotionType } from '@lib/notion/notion.type';

@Injectable()
export class SlackInteractiveService {
  private readonly loggger: Logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
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
    const userList = await this.userRepository.find({
      where: { isSubscribe: false },
    });
    return await this.userRepository.remove(userList);
  }

  /**
   * 메시지 발송
   * @param channel
   * @param message
   */
  async postMessage(channel: string, message: string): Promise<ChatPostMessageResponse> {
    return await this.slack.chat.postMessage({
      text: message,
      channel,
    });
  }

  async updateMessage(channel: string, message: string, ts: string) {
    return await this.slack.chat.update({ text: message, ts, channel });
  }

  /**
   * 에러 메시지 발송
   * @param channelId
   */
  async postErrorMessage(channelId: string) {
    await postMessage(channelId, '알 수 없는 오류가 발생하였습니다❗️');
  }

  /**
   * 구독 설정
   * 이미 구독한 경우 별도 메시지 발송
   * @param userId
   */
  async subscribe(userId: string): Promise<ChatPostMessageResponse> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user.isSubscribe) {
      return await this.postMessage(user.channelId, '앗! 이미 등록되어 있어요.');
    }
    user.isSubscribe = true;
    await this.userRepository.save(user);
    const homeTemplate = this.createView(user);
    await this.slack.views.publish(homeTemplate);
    console.log(`${user.name} 등록완료`);
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
    const user = await this.userRepository.findOneBy({ id: userId });
    const name = user.name;
    if (!user || !user.isSubscribe) {
      return await this.postMessage(user.channelId, '삭제 가능한 유저 정보가 없어요.');
    }
    const homeTemplate = createHomeTemplate(user.id, '11:00', false, 0, 0, 0, false);
    await this.slack.views.publish(homeTemplate);
    user.isSubscribe = false;
    await this.userRepository.save(user);
    console.log(`${name} 삭제완료`);

    const result = await this.postMessage(user.channelId, `${name}, 아쉽지만 다음에 또 봬요.😌`);
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
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return;
    await this.userRepository.save({ ...user, pushTime: selectedTime });
    return await this.postMessage(user.channelId, `메시지 수신 시간을 변경되었습니다. (${selectedTime})`);
  }

  /**
   * 현대인 글귀 구독 설정
   * 이미 수신한 경우 별도 메시지 발송
   * @param userId
   */
  async modernOn(userId: string): Promise<ChatPostMessageResponse> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user.modernText) {
      return await this.postMessage(user.channelId, '앗! 이미 수신 허용 했어요.');
    }
    user.modernText = true;
    await this.userRepository.save(user);
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
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user.modernText) {
      return await this.postMessage(user.channelId, '앗! 이미 수신 거부 했어요.');
    }
    user.modernText = false;
    await this.userRepository.save(user);
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
    const user = await this.userRepository.findOneBy({ id: userId });
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
    await this.userRepository.save(user);
    const homeTemplate = this.createView(user);
    await this.publishView(homeTemplate);
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
   *
   * @param userId
   * @param message
   * @param category
   */
  async onMessageSuggest(userId: string, message: string, category: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
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
