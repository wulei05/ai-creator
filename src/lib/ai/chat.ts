import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getConfig } from '@/lib/config';

export type ChatModel = 'gpt-4o' | 'deepseek-chat' | 'claude-sonnet-4-6';
export type Message = { role: 'user' | 'assistant'; content: string };

export async function* streamChat(
  model: ChatModel,
  messages: Message[]
): AsyncGenerator<string> {
  if (model === 'claude-sonnet-4-6') {
    const anthropic = new Anthropic({ apiKey: await getConfig('ANTHROPIC_API_KEY') });
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages,
    });
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
  } else if (model === 'gpt-4o') {
    const client = new OpenAI({ apiKey: await getConfig('OPENAI_API_KEY') });
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } else {
    const client = new OpenAI({
      apiKey: await getConfig('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com',
    });
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
