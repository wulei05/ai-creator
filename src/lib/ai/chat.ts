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
  | 'gemini-1.5-flash'
  | 'qwen-max'
  | 'qwen-plus'
  | 'qwen-turbo'
  | 'qwq-plus'
  | 'glm-4-plus'
  | 'glm-4-flash'
  | 'glm-z1-plus'
  | 'kimi-latest'
  | 'kimi-thinking-preview';

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
    const apiModelName = GEMINI_API_NAMES[model] ?? model;
    const googleBaseUrl = await getConfig('GOOGLE_BASE_URL');

    // When GOOGLE_BASE_URL is set, route through an OpenAI-compatible gateway
    // (e.g. new-api / gptrouter). Otherwise use Google's native SDK.
    if (googleBaseUrl) {
      const client = new OpenAI({
        apiKey: await getConfig('GOOGLE_API_KEY'),
        baseURL: googleBaseUrl,
      });
      const geminiMessages = messages.map((m): OpenAI.ChatCompletionMessageParam => {
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
        model: apiModelName,
        messages: [...systemMsg, ...geminiMessages],
        stream: true,
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield content;
      }
      return;
    }

    const genAI = new GoogleGenerativeAI(await getConfig('GOOGLE_API_KEY'));
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
    const anthropicBaseUrl = await getConfig('ANTHROPIC_BASE_URL');
    const anthropic = new Anthropic({
      apiKey: await getConfig('ANTHROPIC_API_KEY'),
      ...(anthropicBaseUrl ? { baseURL: anthropicBaseUrl } : {}),
    });

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
    const openaiBaseUrl = await getConfig('OPENAI_BASE_URL');
    const client = new OpenAI({
      apiKey: await getConfig('OPENAI_API_KEY'),
      ...(openaiBaseUrl ? { baseURL: openaiBaseUrl } : {}),
    });

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
      baseURL: (await getConfig('XAI_BASE_URL')) || 'https://api.x.ai/v1',
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

  // ── DeepSeek ─────────────────────────────────────────────────────────────
  } else if (model === 'deepseek-chat' || model === 'deepseek-reasoner') {
    const client = new OpenAI({
      apiKey: await getConfig('DEEPSEEK_API_KEY'),
      baseURL: (await getConfig('DEEPSEEK_BASE_URL')) || 'https://api.deepseek.com',
    });
    const stream = await client.chat.completions.create({
      model,
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

  // ── Qwen (通义千问) ────────────────────────────────────────────────────────
  } else if (['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwq-plus'].includes(model)) {
    const client = new OpenAI({
      apiKey: await getConfig('QWEN_API_KEY'),
      baseURL: (await getConfig('QWEN_BASE_URL')) || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    const stream = await client.chat.completions.create({
      model,
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

  // ── Zhipu GLM (智谱) ───────────────────────────────────────────────────────
  } else if (['glm-4-plus', 'glm-4-flash', 'glm-z1-plus'].includes(model)) {
    const client = new OpenAI({
      apiKey: await getConfig('ZHIPU_API_KEY'),
      baseURL: (await getConfig('ZHIPU_BASE_URL')) || 'https://open.bigmodel.cn/api/paas/v4',
    });
    const stream = await client.chat.completions.create({
      model,
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

  // ── Kimi (月之暗面) ────────────────────────────────────────────────────────
  } else {
    const KIMI_MODEL_MAP: Partial<Record<ChatModel, string>> = {
      'kimi-latest':           'moonshot-v1-128k',
      'kimi-thinking-preview': 'kimi-thinking-preview',
    };
    const client = new OpenAI({
      apiKey: await getConfig('MOONSHOT_API_KEY'),
      baseURL: (await getConfig('MOONSHOT_BASE_URL')) || 'https://api.moonshot.cn/v1',
    });
    const stream = await client.chat.completions.create({
      model: KIMI_MODEL_MAP[model] ?? 'moonshot-v1-128k',
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
