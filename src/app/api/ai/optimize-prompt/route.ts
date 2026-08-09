import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: '缺少提示词' }, { status: 400 });
  }

  const deepseekKey = await getConfig('DEEPSEEK_API_KEY');
  const openaiKey = await getConfig('OPENAI_API_KEY');
  const apiKey = deepseekKey || openaiKey;
  if (!apiKey) {
    return NextResponse.json({ error: '未配置可用的 AI API Key' }, { status: 503 });
  }

  const baseUrl = deepseekKey ? 'https://api.deepseek.com' : 'https://api.openai.com';
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
              'You are an expert AI image generation prompt engineer. ' +
              'Your task is to enhance the user\'s prompt to produce better image generation results. ' +
              'Improve it by: adding specific artistic style terms, lighting descriptions, camera angle, ' +
              'mood/atmosphere, technical quality tags (e.g. 8k, photorealistic, cinematic), and composition details. ' +
              'Keep the core subject intact. Output only the enhanced English prompt, nothing else. ' +
              'If the input is in Chinese, translate and enhance it.',
          },
          { role: 'user', content: text },
        ],
        max_tokens: 600,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message ?? '优化服务暂时不可用' },
        { status: res.status },
      );
    }

    const data = await res.json();
    const optimized = data.choices?.[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ optimized });
  } catch {
    return NextResponse.json({ error: '网络错误，请稍后重试' }, { status: 500 });
  }
}
