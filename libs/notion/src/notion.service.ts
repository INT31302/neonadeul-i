import { Inject, Injectable } from '@nestjs/common';
import { NotionConfig } from '@lib/notion/notion.config';
import { Client } from '@notionhq/client';
import { NotionType } from '@lib/notion/notion.type';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

@Injectable()
export class NotionService {
  private readonly notion: Client;
  constructor(@Inject(NotionConfig) private readonly configs: NotionConfig) {
    this.notion = new Client({ auth: this.configs.notionToken });
  }

  async searchQueryByName(name: string, dbType: NotionType): Promise<string> {
    const response: QueryDatabaseResponse = await this.notion.databases.query({
      database_id: dbType === NotionType.EASTER_EGG ? this.configs.easterEggDataBaseId : '',
      filter: {
        property: '이름',
        title: {
          equals: name,
        },
      },
    });
    return response.results[0]['properties']['텍스트']['rich_text'][0]['plain_text'];
  }
}
