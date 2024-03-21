import { getRandomNumber, isEndWithConsonant } from '@src/modules/common/utils';

describe('utils', () => {
  describe('isEndWithConsonant', () => {
    it.each(['가', '개', '갸', '걔', '거', '게', '겨', '계', '고', '과', '괘', '괴', '교', '구', '궈'])(
      '글자 "%s"가 받침이 없으면 false',
      (stringElement: string) => {
        // when
        const actual = isEndWithConsonant(stringElement);

        // then

        expect(actual).toBeFalsy();
      },
    );
    it.each(['각', '간', '갇', '갈', '갉', '갊', '감', '갑', '값', '갓', '갔'])(
      '글자 "%s"가 받침이 있으면 true',
      (stringElement: string) => {
        // when
        const actual = isEndWithConsonant(stringElement);

        // then
        expect(actual).toBeTruthy();
      },
    );
  });

  describe('getRandomNumber', () => {
    it('난수 생성 시 0 ~ 1 사이의 숫자여야 합니다.', () => {
      // given
      // when
      const actual = getRandomNumber();

      // then
      expect(actual >= 0 && actual <= 1).toBeTruthy();
    });
  });
});
