import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AirtableService } from './airtable.service';
import { AirtableConfig } from '@lib/airtable/airtable.config';
import { OnlineDatabaseInterfaceService } from '@lib/online-database-interface';

@Module({})
export class AirtableModule {
  static register(config: AirtableConfig): DynamicModule {
    const configProvider = this.createConfigProvider(config);
    const serviceProvider = this.createServiceProvider();

    return {
      module: AirtableModule,
      providers: [configProvider, AirtableService, serviceProvider],
      exports: [OnlineDatabaseInterfaceService],
    };
  }

  /**
   * config provider 생성 함수
   * @param config service 에 필요한 options
   * @private
   */
  private static createConfigProvider(config: AirtableConfig): Provider {
    if (!config.apiKey) throw new Error('apiKey는 필수값입니다.');
    if (!config.base) throw new Error('base는 필수값입니다.');
    return {
      provide: AirtableConfig,
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
      useExisting: AirtableService,
    };
  }
}
