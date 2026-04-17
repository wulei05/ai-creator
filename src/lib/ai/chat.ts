import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI, type Part, type Content } from '@google/generative-ai';
import { getConfig } from '@/lib/config';

export type ChatModel =
  | 'gpt-4o'
  | 'deepseek-chat'
  | 'deepseek-reasoner'
  | 'claude-sonnet-4-6'
  | 'grok-4'
  | 'grok-3'
  | 'grok-3-fast'
  | 'grok-3-mini'
  | 'grok-3-mini-fast'
  | 'gemini-3.1-pro'
  | 'gemini-3-pro'
  | 'gemini-3-flash'
  | 'gemini-3.1-flash-lite'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-lite'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

// image is a base64 data URL (e.g. "data:image/jpeg;base64,...")
export type Message = { role: 'user' | 'assistant'; content: string; image?: string };

/** Extract mime type and raw base64 from a data URL */
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  return { mimeType: match[1], base64: match[2] };
}

export async function* streamChat(
  model: ChatModel,
  messages: Message[],
  options?: { system?: string; maxTokens?: number }
): AsyncGenerator<string> {
  const system = options?.system;
  const maxTokens = options?.maxTokens ?? 4096;
  // ── Gemini ────────────────────────────────────────────────────────────────
  const GEMINI_CHAT_MODELS: ChatModel[] = [
    'gemini-3.1-pro', 'gemini-3-pro', 'gemini-3-flash', 'gemini-3.1-flash-lite',
    'gemini-2.5-pro', 'gemini-2.5-flash',
    'gemini-2.0-flash', 'gemini-2.0-flash-lite',
    'gemini-1.5-pro', 'gemini-1.5-flash',
  ];
  // Our internal IDs → actual Google API model names
  const GEMINI_API_NAMES: Partial<Record<ChatModel, string>> = {
    'gemini-3.1-pro':        'gemini-3.1-pro-preview',
    'gemini-3-pro':          'gemini-3-pro-preview',
    'gemini-3-flash':        'gemini-3-flash-preview',
    'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite-preview',
  };

  if (GEMINI_CHAT_MODELS.includes(model)) {
    const genAI = new GoogleGenerativeAI(await getConfig('GOOGLE_API_KEY'));
    const apiModelName = GEMINI_API_NAMES[model] ?? model;
    const geminiModel = genAI.getGenerativeModel({
      model: apiModelName,
      ...(system ? { systemInstruction: system } : {}),
    });

    // Convert history (all but last message)
    const history: Content[] = messages.slice(0, -1).map((m) => {
      const parts: Part[] = [];
      if (m.image) {
        const { mimeType, base64 } = parseDataUrl(m.image);
        parts.push({ inlineData: { mimeType, data: base64 } });
      }
      parts.push({ text: m.content });
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });

    const lastMsg = messages[messages.length - 1];
    const lastParts: Part[] = [];
    if (lastMsg.image) {
      const { mimeType, base64 } = parseDataUrl(lastMsg.image);
      lastParts.push({ inlineData: { mimeType, data: base64 } });
    }
    lastParts.push({ text: lastMsg.content });

    const chat = geminiModel.startChat({ history });
    const result = await chat.sendMessageStream(lastParts);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }

  // ── Claude ────────────────────────────────────────────────────────────────
  } else if (model === 'claude-sonnet-4-6') {
    const anthropic = new Anthropic({ apiKey: await getConfig('ANTHROPIC_API_KEY') });

    const claudeMessages: Anthropic.MessageParam[] = messages.map((m) => {
      if (m.image && m.role === 'user') {
        const { mimeType, base64 } = parseDataUrl(m.image);
        return {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            { type: 'text', text: m.content },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: claudeMessages,
    });
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }

  // ── GPT-4o ────────────────────────────────────────────────────────────────
  } else if (model === 'gpt-4o') {
    const client = new OpenAI({ apiKey: await getConfig('OPENAI_API_KEY') });

    const openaiMessages = messages.map((m): OpenAI.ChatCompletionMessageParam => {
      if (m.image && m.role === 'user') {
        return {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: m.image, detail: 'auto' } },
            { type: 'text', text: m.content },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const systemMsg: OpenAI.ChatCompletionMessageParam[] =
      system ? [{ role: 'system', content: system }] : [];
    const stream = await client.chat.completions.create({
      model,
      messages: [...systemMsg, ...openaiMessages],
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }

  // ── Grok (xAI — OpenAI compatible) ──────────────────────────────────────
  } else if (['grok-4', 'grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast'].includes(model)) {
    const GROK_MODEL_MAP: Partial<Record<ChatModel, string>> = {
      'grok-4':          'grok-4-0709',
      'grok-3':          'grok-3',
      'grok-3-fast':     'grok-4-fast-non-reasoning',
      'grok-3-mini':     'grok-3-mini',
      'grok-3-mini-fast':'grok-4-1-fast-non-reasoning',
    };
    const client = new OpenAI({
      apiKey: await getConfig('XAI_API_KEY'),
      baseURL: 'https://api.x.ai/v1',
    });
    const grokMessages = messages.map((m): OpenAI.ChatCompletionMessageParam => {
      if (m.image && m.role === 'user') {
        return {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: m.image, detail: 'auto' } },
            { type: 'text', text: m.content },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });
    const systemMsg: OpenAI.ChatCompletionMessageParam[] =
      system ? [{ role: 'system', content: system }] : [];
    const stream = await client.chat.completions.create({
      model: GROK_MODEL_MAP[model] ?? model,
      messages: [...systemMsg, ...grokMessages],
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }

  // ── DeepSeek (text only) ──────────────────────────────────────────────────
  } else {
    const DEEPSEEK_MODEL_MAP: Partial<Record<ChatModel, string>> = {
      'deepseek-chat':     'deepseek-chat',
      'deepseek-reasoner': 'deepseek-reasoner',
    };
    const client = new OpenAI({
      apiKey: await getConfig('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com',
    });
    const stream = await client.chat.completions.create({
      model: DEEPSEEK_MODEL_MAP[model] ?? 'deepseek-chat',
      messages: [
        ...(system ? [{ role: 'system' as const, content: system }] : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}
