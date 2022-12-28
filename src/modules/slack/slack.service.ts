import { Injectable, Logger } from '@nestjs/common';
import { ChatPostMessageResponse, WebClient } from '@slack/web-api';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@src/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { getHomeTemplate } from '@src/modules/slack/slack.util';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SlackService {
  private readonly botAccessToken = process.env.BOT_USER_OAUTH_ACCESS_TOKEN;
  private readonly webClient = new WebClient(this.botAccessToken);
  private readonly loggger: Logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, {
    timeZone: 'Asia/Seoul',
  })
  async cleanUpUser() {
    const userList = await this.userRepository.find({
      where: { isSubscribe: false },
    });
    await this.userRepository.remove(userList);
  }

  async subscribe(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user.isSubscribe)
      return await this.postMessage(
        user.channelId,
        '앗! 이미 등록되어 있어요.',
      );
    user.isSubscribe = true;
    await this.userRepository.save(user);
    const homeTemplate = getHomeTemplate(
      user.id,
      user.pushTime,
      user.isSubscribe,
      user.cheering,
      user.motivation,
      user.consolation,
      user.modernText,
    );
    await this.webClient.views.publish(homeTemplate);
    console.log(`${user.name} 등록완료`);
    const result = await this.postMessage(
      user.channelId,
      `${user.name} 어서오세요. 정상적으로 등록이 완료되었습니다.🥰`,
    );
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
  }

  async unsubscribe(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    const name = user.name;
    if (!user || !user.isSubscribe)
      return await this.postMessage(
        user.channelId,
        '삭제 가능한 유저 정보가 없어요.',
      );
    const homeTemplate = getHomeTemplate(
      user.id,
      '11:00',
      false,
      0,
      0,
      0,
      false,
    );
    await this.webClient.views.publish(homeTemplate);
    user.isSubscribe = false;
    await this.userRepository.save(user);
    console.log(`${name} 삭제완료`);

    const result = await this.postMessage(
      user.channelId,
      `${name}, 아쉽지만 다음에 또 봬요.😌`,
    );
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
  }

  async postMessage(
    channel: string,
    message: string,
  ): Promise<ChatPostMessageResponse> {
    return await this.webClient.chat.postMessage({
      text: message,
      channel,
    });
  }

  async postErrorMessage(channelId: string) {
    await postMessage(channelId, '알 수 없는 오류가 발생하였습니다❗️');
  }

  async setTime(userId: any, selectedTime: any) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return;
    await this.userRepository.save({ ...user, pushTime: selectedTime });
    return this.postMessage(
      user.channelId,
      `메시지 수신 시간을 변경되었습니다. (${selectedTime})`,
    );
  }

  async modernOn(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user.modernText)
      return await this.postMessage(
        user.channelId,
        '앗! 이미 수신 허용 했어요.',
      );
    user.modernText = true;
    await this.userRepository.save(user);
    const homeTemplate = getHomeTemplate(
      user.id,
      user.pushTime,
      user.isSubscribe,
      user.cheering,
      user.motivation,
      user.consolation,
      user.modernText,
    );
    await this.webClient.views.publish(homeTemplate);
    const result = await this.postMessage(
      user.channelId,
      `현대인 글귀 구독 상태가 수신 상태로 변경 됐어요!`,
    );
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
  }
  async modernOff(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user.modernText)
      return await this.postMessage(
        user.channelId,
        '앗! 이미 수신 거부 했어요.',
      );
    user.modernText = false;
    await this.userRepository.save(user);
    const homeTemplate = getHomeTemplate(
      user.id,
      user.pushTime,
      user.isSubscribe,
      user.cheering,
      user.motivation,
      user.consolation,
      user.modernText,
    );
    await this.webClient.views.publish(homeTemplate);
    const result = await this.postMessage(
      user.channelId,
      `현대인 글귀 구독 상태가 미수신 상태로 변경 됐어요!`,
    );
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
  }

  async updatePreference(
    userId: string,
    categoryType: CategoryType,
    value: number,
  ) {
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
    const homeTemplate = getHomeTemplate(
      user.id,
      user.pushTime,
      user.isSubscribe,
      user.cheering,
      user.motivation,
      user.consolation,
      user.modernText,
    );
    await this.webClient.views.publish(homeTemplate);
    const result = await this.postMessage(
      user.channelId,
      `${CategoryType[categoryType]} 카테고리 선호도 값이 수정되었습니다.`,
    );
    if (!result.ok) {
      await this.postErrorMessage(user.channelId);
      new Error(result.error);
    }
  }
}
