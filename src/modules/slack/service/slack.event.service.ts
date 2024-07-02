import { Injectable, Logger } from '@nestjs/common';
import { SlackInteractiveService } from '@src/modules/slack/service/slack.interactive.service';
import {
  ChatPostMessageResponse,
  ChatUpdateResponse,
  UsersInfoResponse,
  View,
  ViewsOpenResponse,
  ViewsPublishResponse,
} from '@slack/web-api';
import { User } from '@src/modules/user/entities/user.entity';
import { OpenaiService } from '@lib/openai';
import { SlackRedisType } from '@src/modules/slack/slack.types';
import { InjectSlackClient, SlackClient } from '@int31302/nestjs-slack-listener';
import { UserService } from '@src/modules/user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SlackEventService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    private readonly userService: UserService,
    private readonly slackInteractiveService: SlackInteractiveService,
    private readonly openaiService: OpenaiService,
    @InjectSlackClient()
    private readonly slack: SlackClient,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 봇 호출한 곳이 DM Channel 인지 체크 로직
   * @param event
   */
  isDMChannel(event: any): boolean {
    return event.channel_type !== 'im';
  }

  /**
   * 메시지 수신자가 봇인지 체크 로직
   * @param event
   */
  isBot(event: any): boolean {
    return 'bot_profile' in event;
  }

  /**
   * appHome 설정 로직
   * @param event
   */
  async setHome(event: any): Promise<ViewsPublishResponse> {
    const user = await this.saveUser(event);
    const homeTemplate = this.slackInteractiveService.createView(user);
    return await this.slackInteractiveService.publishView(homeTemplate);
  }

  /**
   * appHome 진입 시 유저 저장 로직
   * @param event
   */
  async saveUser(event: any): Promise<User> {
    const response = await this.getUserInfo(event.user);
    const displayName = response.user.profile.display_name;
    const name = displayName.includes('(') ? this.getNickname(displayName) : displayName;
    return await this.userService.save({
      id: event.user,
      name,
      channelId: event.channel,
    });
  }

  /**
   * 이름에 포함되어있는 닉네임만 가져옵니다.
   * 예를 들면 김상재(제리)는 제리만 가져옴.
   * @param displayName
   * @private
   */
  private getNickname(displayName: string) {
    return displayName.split('(')[1].split(')')[0];
  }

  /**
   * user_id 기반으로 유저 정보 조회 로직
   * @param user_id
   */
  async getUserInfo(user_id: string): Promise<UsersInfoResponse> {
    return await this.slack.users.info({ user: user_id });
  }

  /**
   * 유저가 너나들이에게 메시지를 보낼 시 실행되는 함수
   * openai api 를 이용한 챗봇 기능 사용
   * 챗봇의 경우 api 가 느려서 임시 메시지를 발송하고 수정하는 방식으로 진행
   * @param event
   */
  async sendMessage(event: any): Promise<ChatPostMessageResponse> {
    const user = await this.userService.findOne(event.user);
    // 스레드 내용을 전부 받아옵니다.
    const messageList = await this.getMessageList(event);
    const message = await this.slackInteractiveService.postMessage(user.channelId, '너나들이가 입력중...', event.ts);
    this.eventEmitter.emit('openai', { ts: message.ts, channel: user.channelId, messageList });
    return message;

    // message = message.replace(/\${name}/gi, user.name);
    // message = message.replace(/\${josa}/gi, isEndWithConsonant(user.name) ? '을' : '를');

    // return await this.slackInteractiveService.postMessage(user.channelId, message);
  }

  /**
   * thread ts 를 이용하여 해당 스레드 내용을 모두 받아옵니다.
   * @param event
   * @private
   */
  private async getMessageList(event: any): Promise<string[]> {
    const replyList = await this.slackInteractiveService.getReplyList({
      ts: event.thread_ts ?? event.ts,
      channel: event.channel,
    });
    return replyList.messages.map((message) => {
      return message.text;
    });
  }

  /**
   * 채팅 기능 중 openai 답변이 작성되면 이전 답장 수정
   * @param ts
   * @param message
   * @param channel
   */
  async updateMessage({ ts, messageList, channel }: SlackRedisType): Promise<ChatUpdateResponse> {
    let result: string;
    try {
      result = await this.openaiService.sendMessage(messageList);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e.message, e.stack);
      }
      result = '!너나들이가 많은 사람들의 요청으로 인해 너무 바빠요. 1분 뒤에 다시 시도해주세요!';
    }
    return this.slackInteractiveService.updateMessage(channel, result, ts);
  }

  /**
   * trigger 기반으로 view 를 엽니다.
   * @param triggerId
   * @param view
   */
  async viewOpen(triggerId: string, view: View): Promise<ViewsOpenResponse> {
    return await this.slack.views.open({
      trigger_id: triggerId,
      view,
    });
  }
}
