import { Inject, Injectable } from '@nestjs/common';
import { OpenaiConfig } from '@lib/openai/openai.config';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAIApi;
  constructor(@Inject(OpenaiConfig) private readonly configs: OpenaiConfig) {
    const configuration = new Configuration({
      organization: configs.organization_id,
      apiKey: configs.secret_key,
    });
    this.openai = new OpenAIApi(configuration);
  }
  async sendMessage(message: string): Promise<string> {
    const axiosResponse = await this.openai.createCompletion({
      model: 'text-davinci-003',
      prompt: message,
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false,
    });
    return axiosResponse.data.choices[0].text;
  }
}
