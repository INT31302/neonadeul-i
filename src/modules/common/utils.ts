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
