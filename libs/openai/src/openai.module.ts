import { DynamicModule, Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { OpenaiConfig } from '@lib/openai/openai.config';

@Module({})
export class OpenaiModule {
  static register({ secret_key, organization_id }: OpenaiConfig): DynamicModule {
    if (!secret_key) throw new Error('secret_key는 필수값입니다.');
    if (!organization_id) throw new Error('organization_id는 필수값입니다.');

    const config = Object.assign(new OpenaiConfig(), { secret_key, organization_id });
    return {
      module: OpenaiModule,
      providers: [
        {
          provide: OpenaiConfig,
          useValue: config,
        },
        OpenaiService,
      ],
      exports: [OpenaiService],
    };
  }
}
