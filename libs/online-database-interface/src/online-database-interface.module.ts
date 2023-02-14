import { DynamicModule, Module } from '@nestjs/common';
import { AirtableModule } from '@lib/airtable';
import { NotionModule } from '@lib/notion';
import { ConfigModule } from '@nestjs/config';
import * as process from 'process';
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [],
})
export class OnlineDatabaseInterfaceModule {
  static register(): DynamicModule {
    return {
      module: OnlineDatabaseInterfaceModule,
      imports: [this.getDynamicModules()],
      exports: [this.getDynamicModules()],
    };
  }

  /**
   * 환경 변수에 따른 Module 로드 함수
   * @private
   */
  private static getDynamicModules(): DynamicModule {
    return process.env.ONLINE_DATABASE_PROVIDER === 'AIRTABLE'
      ? AirtableModule.register({ apiKey: process.env.AIRTABLE_API_KEY, base: process.env.AIRTABLE_BASE })
      : NotionModule.register({
          notionToken: process.env.NOTION_TOKEN,
          easterEggDataBaseId: process.env.EASTER_EGG_DB,
          motivationSuggestDataBaseId: process.env.MOTIVATION_SUGGEST_DB,
        });
  }
}
