import { Controller } from '@nestjs/common';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { SlackInteractiveService } from '@src/modules/slack/service/slack.interactive.service';
import { SlackEventService } from '@src/modules/slack/service/slack.event.service';
import { ACTION_ID } from '@src/modules/slack/slack.constants';
import { ChatPostMessageResponse, ChatUpdateResponse, ViewsOpenResponse, ViewsPublishResponse } from '@slack/web-api';
import { Ctx, MessagePattern, Payload, RedisContext } from '@nestjs/microservices';
import { SlackRedisType } from '@src/modules/slack/slack.types';
import { getModal } from '@src/modules/slack/slack.util';
import {
  IncomingSlackEvent,
  IncomingSlackInteractivity,
  IncomingSlackViewInteractivity,
  SlackEventHandler,
  SlackEventListener,
  SlackInteractivityHandler,
  SlackInteractivityListener,
} from '@int31302/nestjs-slack-listener';

@Controller('slack-event')
@SlackEventListener()
@SlackInteractivityListener()
export class SlackController {
  constructor(
    private readonly slackInteractiveService: SlackInteractiveService,
    private readonly slackEventService: SlackEventService,
  ) {}

  @MessagePattern('openai')
  async updateMessageEvent(@Payload() data: SlackRedisType, @Ctx() context: RedisContext): Promise<ChatUpdateResponse> {
    return await this.slackEventService.updateMessage(data);
  }

  // event-api
  @SlackEventHandler('message')
  async onMessage({ event }: IncomingSlackEvent): Promise<ChatPostMessageResponse> {
    if (this.slackEventService.isDMChannel(event)) return;
    if (this.slackEventService.isBot(event)) return;
    if (event.text) {
      return this.slackEventService.sendMessage(event);
    }
  }

  @SlackEventHandler('app_home_opened')
  onAppHomeOpened({ event }: IncomingSlackEvent): Promise<ViewsPublishResponse> {
    return this.slackEventService.setHome(event);
  }

  //interactive-api
  @SlackInteractivityHandler(ACTION_ID.SUBSCRIBE)
  setSubscribe(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.subscribe(userId);
  }
  @SlackInteractivityHandler(ACTION_ID.UNSUBSCRIBE)
  setUnsubscribe(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.unsubscribe(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.MODERN_TEXT_ON)
  setModernTextOn(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.modernOn(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.MODERN_TEXT_OFF)
  setModernTextOff(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    return this.slackInteractiveService.modernOff(userId);
  }

  @SlackInteractivityHandler(ACTION_ID.TIMEPICKER)
  setTime(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    const selectedTime = payload.actions[0].selected_time;
    return this.slackInteractiveService.setTime(userId, selectedTime);
  }

  @SlackInteractivityHandler(ACTION_ID.CHEERING_SCORE)
  setCheeringScore(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    const value = Number(payload.actions[0].selected_option.text.text);
    //
    return this.slackInteractiveService.updatePreference(userId, CategoryType.응원, value);
  }

  @SlackInteractivityHandler(ACTION_ID.MOTIVATION_SCORE)
  setMotivationScore(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    const value = Number(payload.actions[0].selected_option.text.text);

    return this.slackInteractiveService.updatePreference(userId, CategoryType.동기부여, value);
  }

  @SlackInteractivityHandler(ACTION_ID.CONSOLATION_SCORE)
  setConsolationScore(payload: IncomingSlackInteractivity): Promise<ChatPostMessageResponse> {
    const userId = payload.user.id;
    const value = Number(payload.actions[0].selected_option.text.text);

    return this.slackInteractiveService.updatePreference(userId, CategoryType.위로, value);
  }

  @SlackInteractivityHandler(ACTION_ID.MOTIVATION_SUGGEST_MODAL_OPEN)
  openMessageSuggestModalOpen(payload: IncomingSlackInteractivity): Promise<ViewsOpenResponse> {
    return this.slackEventService.viewOpen(payload.trigger_id, getModal());
  }

  @SlackInteractivityHandler(ACTION_ID.MOTIVATION_SUGGEST)
  async onMessageSuggest(payload: IncomingSlackViewInteractivity) {
    const userId = payload.user.id;
    const message: string =
      payload.view.state['values']['motivation_suggest_text_block']['motivation_suggest_text'].value;
    const category: string =
      payload.view.state['values']['motivation_suggest_category_block']['motivation_suggest_category'][
        'selected_option'
      ].value;
    return await this.slackInteractiveService.onMessageSuggest(userId, message, category);
  }
}
