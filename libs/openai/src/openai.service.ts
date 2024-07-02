import { Inject, Injectable, Logger } from '@nestjs/common';
import { OpenaiConfig } from '@lib/openai/openai.config';
import { OpenAI } from 'openai';
import { Chat } from 'openai/resources';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly openai: OpenAI;
  constructor(@Inject(OpenaiConfig) private readonly configs: OpenaiConfig) {
    this.openai = new OpenAI({
      organization: this.configs.organization_id,
      apiKey: this.configs.secret_key,
    });
  }

  /**
   * 유저가 작성한 메시지 기반으로 답장을 받습니다.
   * @param messageList
   */
  async sendMessage(messageList: string[]): Promise<string> {
    try {
      const stream = this.openai.beta.chat.completions.stream({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: '너는 너나들이라는 봇이야.' },
          ...messageList.map((message: string): Chat.ChatCompletionMessageParam => {
            return {
              role: 'user',
              content: message,
            };
          }),
        ],
        stream: true,
      });

      const chatCompletion = await stream.finalChatCompletion();
      return chatCompletion.choices[0].message.content;
    } catch (e) {
      this.logger.error('openai 답장을 불러오는 과정 중 문제가 발생했습니다.');
      throw e;
    }
  }
}
