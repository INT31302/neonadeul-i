import { Body, Controller, Post } from '@nestjs/common';
import { SlackAuthDto } from '@src/modules/slack/dto/slack-auth.dto';
import { SlackService } from '@src/modules/slack/slack.service';
import { CategoryType } from '@src/modules/motivation/movitation.type';

@Controller('slack')
export class SlackController {
  constructor(private slackService: SlackService) {}
  @Post('/events')
  auth(@Body() { challenge }: SlackAuthDto) {
    console.log(challenge);
    return challenge;
  }

  @Post('/interactive')
  async interactive(@Body() { payload }: any) {
    const result = JSON.parse(payload);
    const type = result.actions[0].type;
    const userId = result.user.id;
    if (type === 'button') {
      const value = result.actions[0].value;
      if (value === 'subscribe') await this.slackService.subscribe(userId);
      else if (value === 'unsubscribe')
        await this.slackService.unsubscribe(userId);
      else if (value === 'modernTextOn')
        await this.slackService.modernOn(userId);
      else if (value === 'modernTextOff')
        await this.slackService.modernOff(userId);
    } else if (type === 'timepicker') {
      const selectedTime = result.actions[0].selected_time;
      await this.slackService.setTime(userId, selectedTime);
    } else if (type === 'static_select') {
      const actionId = result.actions[0].action_id;
      const value = Number(result.actions[0].selected_option.text.text);
      if (actionId === 'cheering_static_select-action')
        await this.slackService.updatePreference(
          userId,
          CategoryType.응원,
          value,
        );
      if (actionId === 'motivation_static_select-action')
        await this.slackService.updatePreference(
          userId,
          CategoryType.동기부여,
          value,
        );
      if (actionId === 'consolation_static_select-action')
        await this.slackService.updatePreference(
          userId,
          CategoryType.위로,
          value,
        );
    }
  }
}
