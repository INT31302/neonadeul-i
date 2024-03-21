import { randomBytes } from 'crypto';

/**
 * 맨 마지막 글자에 받침이 있는지 찾아서 있다면 true, 없다면 false 를 반환
 * @param korStr
 */
export const isEndWithConsonant = (korStr: string): boolean => {
  const finalChrCode = korStr.charCodeAt(korStr.length - 1);
  // 0 = 받침 없음, 그 외 = 받침 있음
  const finalConsonantCode = (finalChrCode - 44032) % 28;
  return finalConsonantCode !== 0;
};

/**
 * 0~1 사이의 랜덤한 숫자를 생성합니다.
 */
export const getRandomNumber = (): number => {
  return randomBytes(4).readUInt32LE() / 0xffffffff;
};
