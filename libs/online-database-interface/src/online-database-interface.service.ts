import { CategoryType } from '@src/modules/motivation/movitation.type';

export abstract class OnlineDatabaseInterfaceService {
  /**
   * 이스터에그 조회
   * @param name
   */
  abstract searchEasterEgg(name: string): Promise<string>;

  /**
   * notionType 에 맞는 database 에 page 저장
   * @param date
   * @param message
   * @param category
   */
  abstract createSuggestRecord(date: string, message: string, category: CategoryType): Promise<any>;

  /**
   * 관리자 승인을 받은 추천 글귀 중 추가 안된 글귀 조회
   */
  abstract searchConfirmMotivation(): Promise<any>;

  /**
   * 추가된 추천 글귀에 체크 표시
   * @param response
   */
  abstract updateMotivationRecord(response: any): Promise<any>;
}
