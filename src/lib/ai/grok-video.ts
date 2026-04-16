import { getConfig } from '@/lib/config';

const BASE = 'https://api.x.ai/v1';

export async function createGrokVideo(params: {
  prompt: string;
  duration?: number;
  resolution?: '480p' | '720p';
  aspectRatio?: string;
  imageUrl?: string;        // reference image URL (public https)
}): Promise<string> {
  const apiKey = await getConfig('XAI_API_KEY');

  const body: Record<string, unknown> = {
    model: 'grok-imagine-video',
    prompt: params.prompt,
    duration: Math.min(15, Math.max(1, params.duration ?? 8)),
    resolution: params.resolution ?? '720p',
  };
  if (params.aspectRatio) body.aspect_ratio = params.aspectRatio;
  if (params.imageUrl) body.image_url = params.imageUrl;

  const res = await fetch(`${BASE}/videos/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok video API error: ${err}`);
  }

  const data = await res.json();
  const requestId = data.request_id ?? data.id;
  if (!requestId) throw new Error('Grok video API returned no request_id');
  return requestId as string;
}

export async function getGrokVideoStatus(requestId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
}> {
  const apiKey = await getConfig('XAI_API_KEY');

  const res = await fetch(`${BASE}/videos/${requestId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10_000),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // 内容审核拒绝（返回 4xx 但 body 有 error 字段）
  if (!res.ok) {
    const reason: string = data?.error ?? `HTTP ${res.status}`;
    if (reason.toLowerCase().includes('moderation') || reason.toLowerCase().includes('content')) {
      throw new Error(`内容审核未通过：${reason}`);
    }
    throw new Error(`Grok video status error: ${reason}`);
  }

  const status: string = data.status ?? 'pending';

  // 已完成但 error 字段存在（审核拒绝在 done 状态里）
  if (data.error) {
    const reason: string = data.error;
    if (reason.toLowerCase().includes('moderation') || reason.toLowerCase().includes('content')) {
      throw new Error(`内容审核未通过：${reason}`);
    }
    throw new Error(`Grok video failed: ${reason}`);
  }

  if (status === 'done' || status === 'completed' || status === 'succeeded') {
    const videoUrl: string | undefined =
      data.video?.url ?? data.video_url ?? data.url ?? data.output_url;
    return { status: 'completed', videoUrl };
  }
  if (status === 'failed' || status === 'error') {
    return { status: 'failed' };
  }
  return { status: 'processing' };
}
