import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotionConfig } from '@lib/notion/notion.config';
import { Client } from '@notionhq/client';
import { NotionType } from '@lib/notion/notion.type';
import { UpdatePageResponse } from '@notionhq/client/build/src/api-endpoints';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { getMessageSuggestPage } from '@lib/notion/notion.util';
import { OnlineDatabaseInterfaceService } from '@lib/online-database-interface';
import { MotivationModel } from '@lib/online-database-interface/online-database-interface.type';

@Injectable()
export class NotionService implements OnlineDatabaseInterfaceService {
  private readonly logger: Logger = new Logger(this.constructor.name);
  private readonly notion: Client;
  constructor(@Inject(NotionConfig) private readonly configs: NotionConfig) {
    this.notion = new Client({ auth: this.configs.notionToken });
  }

  /**
   * 이스터에그 조회
   * @param name
   */
  async searchEasterEgg(name: string): Promise<string> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.configs.easterEggDataBaseId,
        filter: {
          property: '이름',
          title: {
            equals: name,
          },
        },
      });
      if (isNil(response.results[0])) return null;
      return response.results[0]['properties']['텍스트']['rich_text'][0]['plain_text'];
    } catch (e) {
      if (e instanceof Error) this.logger.error('이스터에그 조회 과정 중 문제가 발생했습니다.');
      throw e;
    }
  }

  /**
   * notionType 에 맞는 database 에 page 저장
   * @param date
   * @param message
   * @param category
   */
  async createSuggestRecord(date: string, message: string, category: CategoryType): Promise<boolean> {
    try {
      await this.notion.pages.create(getMessageSuggestPage(date, message, category, this.getId(NotionType.SUGGEST)));
      return true;
    } catch (e) {
      if (e instanceof Error) this.logger.error(`${NotionType.SUGGEST} Page 생성 과정 중 문제가 발생했습니다.`);
      throw e;
    }
  }

  /**
   * 관리자 승인을 받은 추천 글귀 중 추가 안된 글귀 조회
   */
  async searchConfirmMotivation(): Promise<MotivationModel[]> {
    try {
      const queryDatabaseResponse = await this.notion.databases.query({
        database_id: this.configs.motivationSuggestDataBaseId,
        filter: {
          and: [
            {
              property: '관리자 승인',
              checkbox: {
                equals: true,
              },
            },
            {
              property: '추가됨',
              checkbox: {
                equals: false,
              },
            },
          ],
        },
      });
      return queryDatabaseResponse.results.map((data) => {
        return {
          id: data.id,
          contents: data['properties']['글귀']['rich_text'][0]['plain_text'],
          category: data['properties']['카테고리']['select']['name'],
        };
      });
    } catch (e) {
      if (e instanceof Error) this.logger.error('글귀 추천 DB 조회 과정 중 문제가 발생했습니다');
      throw e;
    }
  }

  /**
   * 추가된 추천 글귀에 체크 표시
   * @param modelList
   */
  async updateMotivationRecord(modelList: MotivationModel[]): Promise<boolean> {
    try {
      const promiseList: Promise<UpdatePageResponse>[] = modelList.map(({ id }) => {
        return this.notion.pages.update({ page_id: id, properties: { 추가됨: { checkbox: true } } });
      });
      await Promise.all(promiseList);
      return true;
    } catch (e) {
      if (e instanceof Error) this.logger.error('추천 글귀 체크 표시 과정 중 문제가 발생했습니다.');
      throw e;
    }
  }

  /**
   * notionType 에 맞는 database Id 리턴
   * @param notionType
   */
  getId(notionType: NotionType): string {
    return notionType === NotionType.SUGGEST
      ? this.configs.motivationSuggestDataBaseId
      : this.configs.easterEggDataBaseId;
  }
}
