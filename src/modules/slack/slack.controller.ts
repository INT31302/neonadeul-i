import { Body, Controller } from '@nestjs/common';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import {
  SlackEventHandler,
  SlackEventListener,
  SlackInteractivityHandler,
  SlackInteractivityListener,
} from 'nestjs-slack-listener';
import { SlackEventDto } from '@src/modules/slack/dto/slack-event.dto';
import { SlackInteractiveService } from '@src/modules/slack/slack.interactive.service';
import { SlackEventService } from '@src/modules/slack/slack.event.service';
import { ACTION_ID } from '@src/modules/slack/slack.constants';
import { ChatPostMessageResponse, ViewsPublishResponse } from '@slack/web-api';

@Controller('slack-event')
@SlackEventListener()
@SlackInteractivityListener()
export class SlackController {
  constructor(
    private readonly slackInteractiveService: SlackInteractiveService,
    private readonly slackEventService: SlackEventService,
  ) {}

  // event-api
  @SlackEventHandler('message')
  async onMessage(event: SlackEventDto): Promise<ChatPostMessageResponse> {
    console.log(event);
    if (this.slackEventService.isDMChannel(event)) return;
    if (this.slackEventService.isBot(event)) return;
    if (event.text) {
      await this.slackEventService.sendEasterEgg(event);
    }
    return this.slackInteractiveService.postMessage(
      event.channel,
      '안녕하세요! 너나들이의 자세한 내용은 좌측 상단의 홈 탭을 참고해주세요!',
    );
  }

  @SlackEventHandler('app_home_opened')
  onAppHomeOpened(event: any): Promise<ViewsPublishResponse> {
    console.log(event);
    return this.slackEventService.setHome(event);
  }

  //interactive-api
  @SlackInteractivityHandler(ACTION_ID.SUBSCRIBE)
  setSubscribe(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    return this.slackInteractiveService.subscribe(userId);
  }
  @SlackInteractivityHandler(ACTION_ID.UNSUBSCRIBE)
  setUnsubscribe(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    return this.slackInteractiveService.unsubscribe(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.MODERN_TEXT_ON)
  setModernTextOn(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    return this.slackInteractiveService.modernOn(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.MODERN_TEXT_OFF)
  setModernTextOff(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    return this.slackInteractiveService.modernOff(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.TIMEPICKER)
  setTime(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    const selectedTime = result.actions[0].selected_time;
    return this.slackInteractiveService.setTime(userId, selectedTime);
  }

  @SlackInteractivityHandler(ACTION_ID.CHEERING_SCORE)
  setCheeringScore(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    const value = Number(result.actions[0].selected_option.text.text);

    return this.slackInteractiveService.updatePreference(userId, CategoryType.응원, value);
  }

  @SlackInteractivityHandler(ACTION_ID.MOTIVATION_SCORE)
  setMotivationScore(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    const value = Number(result.actions[0].selected_option.text.text);

    return this.slackInteractiveService.updatePreference(userId, CategoryType.동기부여, value);
  }

  @SlackInteractivityHandler(ACTION_ID.CONSOLATION_SCORE)
  setConsolationScore(@Body() { payload }: any): Promise<ChatPostMessageResponse> {
    const result = JSON.parse(payload);
    const userId = result.user.id;
    const value = Number(result.actions[0].selected_option.text.text);

    return this.slackInteractiveService.updatePreference(userId, CategoryType.위로, value);
  }
}
