import { SlackEventDto } from '@src/modules/slack/dto/slack-event.dto';
import {
  ChatPostMessageResponse,
  PlainTextOption,
  UsersInfoResponse,
  ViewsPublishArguments,
  WebClient,
} from '@slack/web-api';
import { getRepository } from 'typeorm';
import { User } from '@src/modules/user/entities/user.entity';

export const isDMChannel = (event: SlackEventDto) => {
  return event.channel_type !== 'im';
};

export const isBot = (event: SlackEventDto) => {
  return event.bot_profile;
};

export const postMessage = async (
  webClient: WebClient,
  channel: string,
  message: string,
): Promise<ChatPostMessageResponse> => {
  return await webClient.chat.postMessage({
    text: message,
    channel,
  });
};

export const setHome = async (webClient: WebClient, event: SlackEventDto) => {
  const user = await saveUser(webClient, event);
  const homeTemplate = getHomeTemplate(
    user.id,
    user.pushTime,
    user.isSubscribe,
    user.cheering,
    user.motivation,
    user.consolation,
    user.modernText,
  );
  await webClient.views.publish(homeTemplate);
};

async function saveUser(webClient: WebClient, event: SlackEventDto) {
  const response = await getUserInfo(webClient, event.user);
  const displayName = response.user.profile.display_name;
  const name = displayName.includes('(')
    ? displayName.split('(')[1].split(')')[0]
    : displayName;
  const user = await getRepository(User).findOneBy({ id: event.user });
  if (!user) {
    return await getRepository(User).save({
      id: event.user,
      name,
      channelId: event.channel,
    });
  } else return user;
}

export const getUserInfo = async (
  webClient: WebClient,
  user_id: string,
): Promise<UsersInfoResponse> => {
  return await webClient.users.info({ user: user_id });
};

export const jvent = async (webClient: WebClient, event: SlackEventDto) => {
  const user = await getRepository(User).findOneBy({ id: event.user });
  if (user.jerry)
    return await postMessage(
      webClient,
      user.channelId,
      '안녕하세요! 너나들이의 자세한 내용은 좌측 상단의 홈 탭을 참고해주세요!',
    );
  user.jerry = true;
  console.log(`${user.name} 제리 활성화`);
  await getRepository(User).save(user);
  return await postMessage(
    webClient,
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
};

export const getValuesSelect = (): PlainTextOption[] => {
  const result: PlainTextOption[] = [];
  for (let i = 0; i < 11; i++) {
    result.push({
      text: {
        type: 'plain_text',
        text: i.toString(),
        emoji: true,
      },
      value: `value-${i}`,
    });
  }
  return result;
};
export const getHomeTemplate = (
  user: string,
  pushTime: string,
  isSubscribe: boolean,
  cheering: number,
  motivation: number,
  consolation: number,
  modernText: boolean,
): ViewsPublishArguments => {
  return {
    user_id: user,
    view: {
      type: 'home',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '소개',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '너나들이는 "너니 나니 하면서 터놓고 지내는 사이"라는 뜻을 가진 순우리말입니다.',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '구독자에 한해 매일 동기부여, 응원, 위로 글귀를 보내드립니다.',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '오늘도 치열하게 살고있는 당신을 항상 응원합니다.',
            emoji: true,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '구독 및 해지',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '아래 버튼을 눌러 언제든지 구독 및 해지가 가능합니다.',
            emoji: true,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                emoji: true,
                text: '구독',
              },
              style: 'primary',
              value: 'subscribe',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                emoji: true,
                text: '해지',
              },
              style: 'danger',
              value: 'unsubscribe',
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `상태: ${isSubscribe ? '*구독중*' : '미구독'}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '시간 설정',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '메시지 수신 시간을 설정합니다.',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '별도의 시간 설정이 없을 경우 평일 오전 11시에 전송됩니다. (공휴일 미발송)',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '모바일 기준 최소 10분 단위로 설정해주세요.',
            emoji: true,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'timepicker',
              initial_time: pushTime,
              placeholder: {
                type: 'plain_text',
                text: 'Select time',
                emoji: true,
              },
              action_id: 'actionId-0',
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '선호도 설정',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '숫자가 낮을 수록 해당 카테고리 메시지 수신 확률이 낮아 집니다. (기본값:10)',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '응원 카테고리 선호도',
          },
          accessory: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: cheering.toString(),
              emoji: true,
            },
            options: getValuesSelect(),
            action_id: 'cheering_static_select-action',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '동기부여 카테고리 선호도',
          },
          accessory: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: motivation.toString(),
              emoji: true,
            },
            options: getValuesSelect(),
            action_id: 'motivation_static_select-action',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '위로 카테고리 선호도',
          },
          accessory: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: consolation.toString(),
              emoji: true,
            },
            options: getValuesSelect(),
            action_id: 'consolation_static_select-action',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '현대인 글귀 구독',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '아래 버튼을 눌러 현대인 글귀 수신을 허용/거부가 가능합니다.',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*수신 설정 시 위의 카테고리 선호도와 상관없이 랜덤하게 발송됩니다.*',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                emoji: true,
                text: '수신',
              },
              style: 'primary',
              value: 'modernTextOn',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                emoji: true,
                text: '미수신',
              },
              style: 'danger',
              value: 'modernTextOff',
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `상태: ${modernText ? '*수신*' : '미수신'}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '건의하기',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '아래 버튼을 누르면 건의 및 불편사항을 전할 수 있는 페이지로 이동됩니다.',
            emoji: true,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                emoji: true,
                text: '페이지 이동',
              },
              url: 'https://forms.gle/HVViJzt4oNV1LUXXA',
              value: 'page',
            },
          ],
        },
      ],
    },
  };
};
