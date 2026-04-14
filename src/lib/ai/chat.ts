import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ChatModel = 'gpt-4o' | 'deepseek-chat' | 'claude-sonnet-4-6';
export type Message = { role: 'user' | 'assistant'; content: string };

export async function* streamChat(
  model: ChatModel,
  messages: Message[]
): AsyncGenerator<string> {
  if (model === 'claude-sonnet-4-6') {
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
  } else {
    const client = model === 'gpt-4o' ? openai : deepseek;
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
