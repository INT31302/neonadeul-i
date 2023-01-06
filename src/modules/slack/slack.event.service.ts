import { Inject, Injectable, Logger } from '@nestjs/common';
import { SlackInteractiveService } from '@src/modules/slack/slack.interactive.service';
import { ChatPostMessageResponse, ChatUpdateResponse, UsersInfoResponse, ViewsPublishResponse } from '@slack/web-api';
import { User } from '@src/modules/user/entities/user.entity';
import { InjectSlackClient, SlackClient } from 'nestjs-slack-listener';
import { NotionType } from '@lib/notion/notion.type';
import { NotionService } from '@lib/notion';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { OpenaiService } from '@lib/openai';
import { ClientProxy } from '@nestjs/microservices';
import { SlackRedisType } from '@src/modules/slack/slack.types';

@Injectable()
export class SlackEventService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly slackInteractiveService: SlackInteractiveService,
    private readonly notionService: NotionService,
    private readonly openaiService: OpenaiService,
    @InjectSlackClient()
    private readonly slack: SlackClient,
    @Inject('REDIS') private client: ClientProxy,
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
    const name = displayName.includes('(') ? displayName.split('(')[1].split(')')[0] : displayName;
    const user = await this.userRepository.findOneBy({ id: event.user });
    if (!user) {
      return await this.userRepository.save({
        id: event.user,
        name,
        channelId: event.channel,
      });
    } else return user;
  }

  /**
   * user_id 기반으로 유저 정보 조회 로직
   * @param user_id
   */
  async getUserInfo(user_id: string): Promise<UsersInfoResponse> {
    return await this.slack.users.info({ user: user_id });
  }

  /**
   *
   * @param event
   */
  async sendMessage(event: any): Promise<ChatPostMessageResponse> {
    let message = await this.notionService.searchQueryByName(event.text, NotionType.EASTER_EGG);
    const user = await this.userRepository.findOneBy({ id: event.user });
    if (isNil(message)) {
      const { ts } = await this.slackInteractiveService.postMessage(
        user.channelId,
        '너나들이가 입력중... (답변이  작성되면 수정됩니다.)',
      );
      this.client.emit<number>('openai', { ts, channelId: user.channelId, message });

      return;
      // return this.slackInteractiveService.updateMessage(user.channelId, message, ts);
      // return await this.slackInteractiveService.postMessage(
      //   user.channelId,
      //   '안녕하세요! 너나들이의 자세한 내용은 좌측 상단의 홈 탭을 참고해주세요!',
      // );
    }
    message = message.replace(/\${name}/gi, user.name);
    return await this.slackInteractiveService.postMessage(user.channelId, message);
  }

  async updateMessage({ ts, message, channel }: SlackRedisType): Promise<ChatUpdateResponse> {
    const result = await this.openaiService.sendMessage(message);
    return this.slackInteractiveService.updateMessage(channel, result, ts);
  }
}
