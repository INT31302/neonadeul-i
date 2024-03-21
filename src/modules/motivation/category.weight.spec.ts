import { CategoryWeight } from '@src/modules/motivation/category.weight';
import { CategoryType } from '@src/modules/motivation/movitation.type';

describe('CategoryWeight', () => {
  describe('getCategoryByWeight', () => {
    it('카테고리 가중치의 오차는 1% 이하여야 한다.', () => {
      // given
      const motivationWeightRatio = 0.2;
      const cheeringWeightRatio = 0.3;
      const consolationWeightRatio = 0.5;
      const attempt = 100000;
      const categoryWeight = new CategoryWeight(
        motivationWeightRatio * 10,
        cheeringWeightRatio * 10,
        consolationWeightRatio * 10,
      );
      const categoryResultMap = new Map<CategoryType, number>();

      // when
      for (let i = 0; i < attempt; i++) {
        const category = categoryWeight.getCategoryByWeight();
        if (!categoryResultMap.has(category)) {
          categoryResultMap.set(category, 1);
          continue;
        }
        categoryResultMap.set(category, categoryResultMap.get(category) + 1);
      }

      // then
      expect(
        Math.abs(categoryResultMap.get(CategoryType.동기부여) / attempt - motivationWeightRatio),
      ).toBeLessThanOrEqual(0.1);
      expect(Math.abs(categoryResultMap.get(CategoryType.응원) / attempt - cheeringWeightRatio)).toBeLessThanOrEqual(
        0.1,
      );
      expect(Math.abs(categoryResultMap.get(CategoryType.위로) / attempt - consolationWeightRatio)).toBeLessThanOrEqual(
        0.1,
      );
    });
  });
});
