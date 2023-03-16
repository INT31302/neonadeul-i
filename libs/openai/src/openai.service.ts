import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenaiConfig } from '@lib/openai/openai.config';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly openai: OpenAIApi;
  constructor(@Inject(OpenaiConfig) private readonly configs: OpenaiConfig) {
    const configuration = new Configuration({
      organization: configs.organization_id,
      apiKey: configs.secret_key,
    });
    this.openai = new OpenAIApi(configuration);
  }

  /**
   * 유저가 작성한 메시지 기반으로 답장을 받습니다.
   * @param message
   */
  async sendMessage(message: string): Promise<string> {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '너는 너나들이라는 봇이야.' },
          { role: 'user', content: message },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      });
      return response.data.choices[0].message.content;
    } catch (e) {
      this.logger.error('openai 답장을 불러오는 과정 중 문제가 발생했습니다.');
      throw e;
    }
  }
}
