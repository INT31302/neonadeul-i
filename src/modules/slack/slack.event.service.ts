import { Injectable, Logger } from '@nestjs/common';
import { NotionService } from '@lib/notion';
import { BotProfile, SlackEventDto } from '@src/modules/slack/dto/slack-event.dto';
import { SlackInteractiveService } from '@src/modules/slack/slack.interactive.service';
import { UserRepository } from '@src/modules/user/repository/user.repository';
import { ChatPostMessageResponse, UsersInfoResponse, ViewsPublishResponse } from '@slack/web-api';
import { User } from '@src/modules/user/entities/user.entity';
import { InjectSlackClient, SlackClient } from 'nestjs-slack-listener';

@Injectable()
export class SlackEventService {
  private readonly logger: Logger = new Logger(this.constructor.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly notionService: NotionService,
    private readonly slackInteractiveService: SlackInteractiveService,
    @InjectSlackClient()
    private readonly slack: SlackClient,
  ) {}

  /**
   * 봇 호출한 곳이 DM Channel 인지 체크 로직
   * @param event
   */
  isDMChannel(event: SlackEventDto): boolean {
    return event.channel_type !== 'im';
  }

  /**
   * 메시지 수신자가 봇인지 체크 로직
   * @param event
   */
  isBot(event: SlackEventDto): BotProfile {
    return event.bot_profile;
  }

  /**
   * appHome 설정 로직
   * @param event
   */
  async setHome(event: SlackEventDto): Promise<ViewsPublishResponse> {
    const user = await this.saveUser(event);
    const homeTemplate = this.slackInteractiveService.createView(user);
    return await this.slackInteractiveService.publishView(homeTemplate);
  }

  /**
   * appHome 진입 시 유저 저장 로직
   * @param event
   */
  async saveUser(event: SlackEventDto): Promise<User> {
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
   * 이스터에그 메시지 발송
   * @param event
   * @param message
   */
  async sendEasterEgg(event: SlackEventDto, message: string): Promise<ChatPostMessageResponse> {
    const user = await this.userRepository.findOneBy({ id: event.user });
    message = message.replace(/\${name}/gi, user.name);
    // if (user.jerry)
    //   return await this.slackInteractiveService.postMessage(
    //     user.channelId,
    //     '안녕하세요! 너나들이의 자세한 내용은 좌측 상단의 홈 탭을 참고해주세요!',
    //   );
    // user.jerry = true;
    // console.log(`${user.name} 제리 활성화`);
    // await this.userRepository.save(user);
    return await this.slackInteractiveService.postMessage(user.channelId, message);
  }
}
