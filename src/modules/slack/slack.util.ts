import { PlainTextOption, ViewsPublishArguments } from '@slack/web-api';
import { ACTION_ID } from '@src/modules/slack/slack.constants';

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
export const createHomeTemplate = (
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
              action_id: ACTION_ID.SUBSCRIBE,
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
              action_id: ACTION_ID.UNSUBSCRIBE,
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
              action_id: ACTION_ID.TIMEPICKER,
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
            action_id: ACTION_ID.CHEERING_SCORE,
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
            action_id: ACTION_ID.MOTIVATION_SCORE,
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
            action_id: ACTION_ID.CONSOLATION_SCORE,
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
              action_id: ACTION_ID.MODERN_TEXT_ON,
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
              action_id: ACTION_ID.MODERN_TEXT_OFF,
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
