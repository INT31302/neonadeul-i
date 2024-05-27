export enum CategoryType {
  동기부여,
  응원,
  위로,
  기타,
}

export type CategoryWeightType = {
  category: CategoryType;
  weight: number;
};
