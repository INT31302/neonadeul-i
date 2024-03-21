import { CategoryType, CategoryWeightType } from '@src/modules/motivation/movitation.type';
import { getRandomNumber } from '@src/modules/common/utils';

export class CategoryWeight {
  private readonly motivation: number;
  private readonly cheering: number;
  private readonly consolation: number;
  constructor(motivation: number, cheering: number, consolation: number) {
    this.motivation = motivation;
    this.cheering = cheering;
    this.consolation = consolation;
  }

  /**
   * 유저의 선호도 기반으로 가중치를 계산합니다.
   */
  private calculateWeight(): CategoryWeightType[] {
    const totalWeight = this.motivation + this.cheering + this.consolation;
    const weightRatioList: CategoryWeightType[] = [
      { category: CategoryType['동기부여'], weight: this.motivation / totalWeight },
      { category: CategoryType['응원'], weight: this.cheering / totalWeight },
      { category: CategoryType['위로'], weight: this.consolation / totalWeight },
    ];

    return weightRatioList.sort((a, b) => a.weight - b.weight);
  }

  /**
   * 가중치 기반으로 카테고리를 선정합니다.
   */
  getCategoryByWeight(): CategoryType {
    // 1. 랜덤 기준점 설정
    const pivot = getRandomNumber();

    const categoryWeightList = this.calculateWeight();

    // 2. 가중치의 오름차순으로 원소들을 순회하며 가중치를 누적
    let acc = 0;
    for (const { category, weight } of categoryWeightList) {
      acc += weight;
      if (pivot <= acc) {
        return category;
      }
    }
    return null;
  }
}
