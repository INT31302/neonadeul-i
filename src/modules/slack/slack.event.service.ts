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

  async jvent(event: SlackEventDto): Promise<ChatPostMessageResponse> {
    const user = await this.userRepository.findOneBy({ id: event.user });
    if (user.jerry)
      return await this.slackInteractiveService.postMessage(
        user.channelId,
        '안녕하세요! 너나들이의 자세한 내용은 좌측 상단의 홈 탭을 참고해주세요!',
      );
    user.jerry = true;
    console.log(`${user.name} 제리 활성화`);
    await this.userRepository.save(user);
    return await this.slackInteractiveService.postMessage(
      user.channelId,
      `안녕하세요. ${user.name}. 제리입니다. 매의 눈으로 찾으셨네요 ㅎㅎ 혹시 매이신가요??
각설하고 제가 엔라이튼에서 근무한지 어언 8개월이 되어가네요. 첫회사이자 사회생활의 시작점이라 아직은 많은 것이 새롭고 서툴고 부족하다고 많이 느껴요.
${user.name}도 극복했거나 극복중인 과정들이겠죠?

너나들이는 '너니 나니 하면서 터놓고 지내는 사이'라는 뜻을 가진 순우리말이에요. 정말 이쁘죠?!
앱 이름과 제작 계기는 아주 밀접한 관련이 있답니다.

첫째는 무조건적인 응원 및 위로를 줄 수 있는 매개체가 있었으면 좋겠다는 생각이 들었어요.
업무적인 긍/부정적 평가보다 자기 자신에 대한 무조건적인 응원 및 위로, 칭찬을 주는 무언가가 있다면 정말 큰 힘이 될 것이라 생각을 했어요.
어떤가요? 도움이 많이 되고 있나요?

둘째는 저의 큰 용기라고 생각해요.
MBTI에서는 I라고 하죠? 저는 내향적인 성격을 가졌어요. 물론 스스로는 조용한 관종(ㅋㅋ)이라고 생각합니다.
저와 아무런 접점이 없던 분들이라도 '너나들이'까진 아니더라도 좋은 인연이 될 수 있는 계기가 됐으면 좋겠어요.

글귀는 인터넷에서 찾지만 직접 적으며 추가하는 거 아셨나요? 그 때마다 저 또한 응원과 위로를 받고 있어요!
긴 글 읽어주셔서 감사드리고 마지막으로 저에게 가장 많은 힘이 되준 글귀 적어드리고 인사드릴게요.

괜찮아. 너는 충분히 잘하고 있어.`,
    );
  }
}
