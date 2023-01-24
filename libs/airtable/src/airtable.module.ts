import { DynamicModule, Module } from '@nestjs/common';
import { AirtableService } from './airtable.service';
import { AirtableConfig } from '@lib/airtable/airtable.config';

@Module({})
export class AirtableModule {
  static register({ apiKey, base }: AirtableConfig): DynamicModule {
    if (!apiKey) throw new Error('apiKey는 필수값입니다.');
    if (!base) throw new Error('base는 필수값입니다.');

    const config = Object.assign(new AirtableConfig(), { apiKey, base });
    return {
      module: AirtableModule,
      providers: [
        {
          provide: AirtableConfig,
          useValue: config,
        },
        AirtableService,
      ],
      exports: [AirtableService],
    };
  }
}
