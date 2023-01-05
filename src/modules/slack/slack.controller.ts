import { Controller } from '@nestjs/common';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import {
  SlackEventHandler,
  SlackEventListener,
  SlackInteractivityHandler,
  SlackInteractivityListener,
} from 'nestjs-slack-listener';
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
  async onMessage({ event }: any): Promise<ChatPostMessageResponse> {
    console.log(event);
    if (this.slackEventService.isDMChannel(event)) return;
    if (this.slackEventService.isBot(event)) return;
    if (event.text) {
      await this.slackEventService.sendMessage(event);
    }
  }

  @SlackEventHandler('app_home_opened')
  onAppHomeOpened({ event }: any): Promise<ViewsPublishResponse> {
    return this.slackEventService.setHome(event);
  }

  //interactive-api
  @SlackInteractivityHandler(ACTION_ID.SUBSCRIBE)
  setSubscribe(payload: any): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.subscribe(userId);
  }
  @SlackInteractivityHandler(ACTION_ID.UNSUBSCRIBE)
  setUnsubscribe(payload: any): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.unsubscribe(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.MODERN_TEXT_ON)
  setModernTextOn(payload: any): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.modernOn(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.MODERN_TEXT_OFF)
  setModernTextOff(payload: any): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.modernOff(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.TIMEPICKER)
  setTime(payload: any): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    const selectedTime = payload.actions[0].selected_time;
    return this.slackInteractiveService.setTime(userId, selectedTime);
  }

  @SlackInteractivityHandler(ACTION_ID.CHEERING_SCORE)
  setCheeringScore(payload: any) {
    const userId = payload.user.id;
    const value = Number(payload.actions[0].selected_option.text.text);
    //
    return this.slackInteractiveService.updatePreference(userId, CategoryType.응원, value);
  }

  @SlackInteractivityHandler(ACTION_ID.MOTIVATION_SCORE)
  setMotivationScore(payload: any): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    const value = Number(payload.actions[0].selected_option.text.text);

    return this.slackInteractiveService.updatePreference(userId, CategoryType.동기부여, value);
  }

  @SlackInteractivityHandler(ACTION_ID.CONSOLATION_SCORE)
  setConsolationScore(payload: any): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    const value = Number(payload.actions[0].selected_option.text.text);

    return this.slackInteractiveService.updatePreference(userId, CategoryType.위로, value);
  }
}
