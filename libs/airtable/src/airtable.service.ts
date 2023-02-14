import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Airtable from 'airtable';
import { AirtableConfig } from '@lib/airtable/airtable.config';
import { AirtableBase } from 'airtable/lib/airtable_base';
import { FieldSet, Records } from 'airtable';
import Record from 'airtable/lib/record';
import { CategoryType } from '@src/modules/motivation/movitation.type';
import { OnlineDatabaseInterfaceService } from '@lib/online-database-interface';

@Injectable()
export class AirtableService implements OnlineDatabaseInterfaceService {
  private readonly logger: Logger = new Logger(this.constructor.name);
  private readonly airtableBase: AirtableBase;
  private readonly EASTER_EGG_TABLE_NAME = '이스터에그';
  private readonly SUGGEST_TABLE_NAME = '글귀 추천';
  constructor(@Inject(AirtableConfig) private readonly configs: AirtableConfig) {
    this.airtableBase = new Airtable({ apiKey: this.configs.apiKey }).base(this.configs.base);
  }

  /**
   *
   * @param text
   */
  async searchEasterEgg(text: string): Promise<string> {
    try {
      const dataList = await this.airtableBase
        .table(this.EASTER_EGG_TABLE_NAME)
        .select({
          cellFormat: 'json',
          fields: ['텍스트', '내용'],
          filterByFormula: `AND({텍스트} = '${text}', {표시 여부} = 1)`,
        })
        .firstPage();
      if (dataList.length === 0) return null;
      return dataList[0].get('내용') as string;
    } catch (e) {
      if (e instanceof Error) this.logger.error('이스터에그 조회 과정 중 문제가 발생했습니다.');
      throw e;
    }
  }

  /**
   * 글귀 추천 record 추가
   */
  async createSuggestRecord(date: string, message: string, category: CategoryType): Promise<Record<FieldSet>> {
    try {
      return await this.airtableBase
        .table(this.SUGGEST_TABLE_NAME)
        .create({ 날짜: date, 글귀: message, 카테고리: CategoryType[category] });
    } catch (e) {
      if (e instanceof Error) this.logger.error('글귀 추천 조회 과정 중 문제가 발생했습니다');
      throw e;
    }
  }
  /**
   * 관리자 승인을 받은 추천 글귀 중 추가 안된 글귀 조회
   */
  async searchConfirmMotivation(): Promise<Records<FieldSet>> {
    try {
      return await this.airtableBase
        .table(this.SUGGEST_TABLE_NAME)
        .select({
          cellFormat: 'json',
          fields: ['글귀', '카테고리'],
          filterByFormula: 'AND({관리자 승인} = 1, {추가됨} = 0)',
        })
        .all();
    } catch (e) {
      if (e instanceof Error) this.logger.error('글귀 추천 조회 과정 중 문제가 발생했습니다');
      throw e;
    }
  }

  /**
   * 추가된 추천 글귀에 체크 표시
   * @param response
   */
  async updateMotivationRecord(response: Records<FieldSet>): Promise<Record<FieldSet>[]> {
    try {
      const promiseList: Promise<Record<FieldSet>>[] = response.map(({ id }) => {
        return this.airtableBase.table(this.SUGGEST_TABLE_NAME).update(id, { 추가됨: true });
      });
      return await Promise.all(promiseList);
    } catch (e) {
      if (e instanceof Error) this.logger.error('추천 글귀 체크 표시 과정 중 문제가 발생했습니다.');
      throw e;
    }
  }
}
