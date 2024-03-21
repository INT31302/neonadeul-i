import { ModalView, ViewsPublishArguments } from '@slack/web-api';
import { ACTION_ID } from '@src/modules/slack/slack.constants';
import { Bits, Blocks, Elements, Md, OptionBuilder, Surfaces, ViewBlockBuilder } from 'slack-block-builder';
import { Appendable, Label, OptionGroups } from 'slack-block-builder/dist/internal';

export const getValuesSelect = (): OptionBuilder[] => {
  const result: OptionBuilder[] = [];
  for (let i = 0; i < 11; i++) {
    result.push(Bits.Option().text(i.toString()).value(`value-${i}`));
  }
  return result;
};

function getIntroductionBlocks(): Appendable<ViewBlockBuilder> {
  return [
    Blocks.Header().text('소개'),
    Blocks.Section().text('너나들이는 "너니 나니 하면서 터놓고 지내는 사이"라는 뜻을 가진 순우리말입니다.'),
    Blocks.Section().text('구독자에 한해 매일 동기부여, 응원, 위로 글귀를 보내드립니다.'),
    Blocks.Section().text('오늘도 치열하게 사고있는 당신을 항상 응원합니다.'),
  ];
}

function getSubscriptionBlocks(isSubscribe: boolean): Appendable<ViewBlockBuilder> {
  return [
    Blocks.Header().text('구독 및 해지'),
    Blocks.Section().text('아래 버튼을 눌러 언제든지 구독 및 해지가 가능합니다.'),
    Blocks.Actions().elements(
      Elements.Button().text('구독').actionId(ACTION_ID.SUBSCRIBE).value('subscribe').primary(true),
      Elements.Button().text('해지').actionId(ACTION_ID.UNSUBSCRIBE).value('unsubscribe').danger(true),
    ),
    Blocks.Section().text(`상태: ${isSubscribe ? Md.bold('구독중') : '미구독'}`),
  ];
}

function getPushBlocks(pushTime: string): Appendable<ViewBlockBuilder> {
  return [
    Blocks.Header().text('시간 설정'),
    Blocks.Section().text('메시지 수신 시간을 설정합니다.'),
    Blocks.Section().text('별도의 시간 설정이 없을 경우 평일 오전 11시에 전송됩니다. (공휴일 미발송)'),
    Blocks.Section().text('모바일 기준 최소 10분 단위로 설정해주세요.'),
    Blocks.Actions().elements(
      Elements.TimePicker().initialTime(pushTime).placeholder('Select time').actionId(ACTION_ID.TIMEPICKER),
    ),
  ];
}

function getPreferenceBlocks(cheering: number, motivation: number, consolation: number): Appendable<ViewBlockBuilder> {
  return [
    Blocks.Header().text('선호도 설정'),
    Blocks.Section().text('숫자가 낮을 수록 해당 카테고리 메시지 수신 확률이 낮아 집니다. (기본값:10)'),
    Blocks.Section()
      .text('응원 카테고리 선호도')
      .accessory(
        Elements.StaticSelect()
          .placeholder(cheering.toString())
          .options(getValuesSelect())
          .actionId(ACTION_ID.CHEERING_SCORE),
      ),
    Blocks.Section()
      .text('동기부여 카테고리 선호도')
      .accessory(
        Elements.StaticSelect()
          .placeholder(motivation.toString())
          .options(getValuesSelect())
          .actionId(ACTION_ID.MOTIVATION_SCORE),
      ),
    Blocks.Section()
      .text('위로 카테고리 선호도')
      .accessory(
        Elements.StaticSelect()
          .placeholder(consolation.toString())
          .options(getValuesSelect())
          .actionId(ACTION_ID.CONSOLATION_SCORE),
      ),
  ];
}

function getModernBlocks(isModernText: boolean): Appendable<ViewBlockBuilder> {
  return [
    Blocks.Header().text('현대인 글귀 구독'),
    Blocks.Section().text('아래 버튼을 눌러 현대인 글귀 수신을 허용/거부가 가능합니다.'),
    Blocks.Section().text(Md.bold('수신 설정 시 위의 카테고리 선호도와 상관없이 랜덤하게 발송됩니다.')),
    Blocks.Actions().elements(
      Elements.Button().text('수신').actionId(ACTION_ID.MODERN_TEXT_ON).value('modernTextOn').primary(true),
      Elements.Button().text('미수신').actionId(ACTION_ID.MODERN_TEXT_OFF).value('modernTextOff').danger(true),
    ),
    Blocks.Section().text(`상태: ${isModernText ? Md.bold('수신') : '미수신'}`),
  ];
}

function getRecommendBlocks(): Appendable<ViewBlockBuilder> {
  return [
    Blocks.Header().text('글귀 추천하기'),
    Blocks.Section().text('아래 버튼을 눌러 글귀를 추천할 수 있습니다.'),
    Blocks.Section().text('익명으로 요청되니 편하게 신청해주세요😉'),
    Blocks.Actions().elements(
      Elements.Button()
        .text('추천하기')
        .value('message_suggest_modal_open')
        .actionId(ACTION_ID.MOTIVATION_SUGGEST_MODAL_OPEN),
    ),
  ];
}

function getSuggestionBlocks(): Appendable<ViewBlockBuilder> {
  return [
    Blocks.Header().text('건의하기'),
    Blocks.Section().text('아래 버튼을 누르면 건의 및 불편사항을 전할 수 있는 페이지로 이동됩니다.'),
    Blocks.Actions().elements(
      Elements.Button().text('페이지 이동').url('https://forms.gle/HVViJzt4oNV1LUXXA').value('page'),
    ),
  ];
}
export const createHomeTemplate = (
  user: string,
  pushTime: string,
  isSubscribe: boolean,
  cheering: number,
  motivation: number,
  consolation: number,
  isModernText: boolean,
): ViewsPublishArguments => {
  return {
    user_id: user,
    view: {
      type: 'home',
      blocks: Surfaces.HomeTab()
        .blocks(
          ...getIntroductionBlocks(),
          Blocks.Divider(),
          ...getSubscriptionBlocks(isSubscribe),
          Blocks.Divider(),
          ...getPushBlocks(pushTime),
          Blocks.Divider(),
          ...getPreferenceBlocks(cheering, motivation, consolation),
          Blocks.Divider(),
          ...getModernBlocks(isModernText),
          Blocks.Divider(),
          ...getRecommendBlocks(),
          Blocks.Divider(),
          ...getSuggestionBlocks(),
        )
        .getBlocks(),
    },
  };
};

export const getModal = (): ModalView => {
  return Surfaces.Modal()
    .title('글귀 추천')
    .submit('제출')
    .callbackId(ACTION_ID.MOTIVATION_SUGGEST)
    .blocks(
      Blocks.Input()
        .blockId('motivation_suggest_text_block')
        .label('제출')
        .element(
          Elements.TextInput()
            .actionId('motivation_suggest_text')
            .multiline(true)
            .placeholder('너나들이에게 새로운 글귀를 추천해주세요!'),
        ),
      Blocks.Input()
        .blockId('motivation_suggest_category_block')
        .dispatchAction(true)
        .element(
          Elements.StaticSelect()
            .placeholder('카테고리르 선택해주세요')
            .options(
              Bits.Option().text('동기부여').value('motivation'),
              Bits.Option().text('응원').value('cheering'),
              Bits.Option().text('위로').value('consolation'),
              Bits.Option().text('현대인 글귀').value('modern'),
            )
            .actionId('motivation_suggest_category'),
        )
        .label('카테고리'),
    )
    .buildToObject();
};
