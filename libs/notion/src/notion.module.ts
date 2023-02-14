import { DynamicModule, Module, Provider } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionConfig } from '@lib/notion/notion.config';
import { OnlineDatabaseInterfaceService } from '@lib/online-database-interface';

@Module({})
export class NotionModule {
  static register(config: NotionConfig): DynamicModule {
    const configProvider = this.createConfigProvider(config);
    const serviceProvider = this.createServiceProvider();
    return {
      module: NotionModule,
      providers: [configProvider, NotionService, serviceProvider],
      exports: [OnlineDatabaseInterfaceService],
    };
  }

  /**
   * config provider 생성 함수
   * @param config service 에 필요한 options
   * @private
   */
  private static createConfigProvider(config: NotionConfig): Provider {
    if (!config.notionToken) throw new Error('notionToken은 필수값입니다.');
    if (!config.easterEggDataBaseId) throw new Error('easterEggDataBaseId는 필수값입니다.');
    if (!config.motivationSuggestDataBaseId) throw new Error('motivationSuggestDataBaseId 필수값입니다.');
    return {
      provide: NotionConfig,
      useValue: config,
    };
  }

  /**
   * service provider 생성 함수
   * @private
   */
  private static createServiceProvider(): Provider {
    return {
      provide: OnlineDatabaseInterfaceService,
      useExisting: NotionService,
    };
  }
}
