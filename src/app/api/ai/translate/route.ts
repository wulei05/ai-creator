import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: '缺少文本' }, { status: 400 });
  }

  // 优先使用 DeepSeek（便宜快速），其次 OpenAI
  const deepseekKey = await getConfig('DEEPSEEK_API_KEY');
  const openaiKey = await getConfig('OPENAI_API_KEY');

  const apiKey = deepseekKey || openaiKey;
  if (!apiKey) {
    return NextResponse.json({ error: '未配置可用的 AI API Key' }, { status: 503 });
  }

  const baseUrl = deepseekKey
    ? 'https://api.deepseek.com'
    : 'https://api.openai.com';
  const model = deepseekKey ? 'deepseek-chat' : 'gpt-4o-mini';

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at writing image generation prompts. ' +
              'Translate the user\'s description into a high-quality English prompt optimized for AI image generation. ' +
              'Keep it concise, descriptive, and effective. Return only the translated prompt, nothing else.',
          },
          { role: 'user', content: text },
        ],
        max_tokens: 500,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message ?? '翻译服务暂时不可用' },
        { status: res.status },
      );
    }

    const data = await res.json();
    const translated = data.choices?.[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ error: '网络错误，请稍后重试' }, { status: 500 });
  }
}
