import { getConfig } from '@/lib/config';

const BASE_URL = 'https://api.klingai.com/v1';

export type KlingModel = 'kling-v1' | 'kling-v1-5' | 'kling-v1-6' | 'kling-v1-6-10s' | 'kling-v2' | 'kling-v2-10s' | 'kling-v2-5' | 'kling-v2-5-10s' | 'kling-v2-6' | 'kling-v2-6-10s' | 'kling-o1';

export async function createKlingVideo(params: {
  prompt: string;
  image_url?: string; // optional — if omitted, uses text2video endpoint
  duration: 5 | 10;
  aspect_ratio: string;
  model?: KlingModel;
}): Promise<string> {
  const KLING_KEY = await getConfig('KLING_API_KEY');
  // Strip the "-10s" suffix — Kling API uses model name without duration suffix
  const model_name = (params.model ?? 'kling-v2').replace(/-10s$/, '');

  // Choose endpoint: image2video vs text2video
  const endpoint = params.image_url
    ? `${BASE_URL}/videos/image2video`
    : `${BASE_URL}/videos/text2video`;

  const body: Record<string, unknown> = {
    model_name,
    prompt: params.prompt,
    duration: String(params.duration),
    aspect_ratio: params.aspect_ratio,
    cfg_scale: 0.5,
  };
  if (params.image_url) {
    body.image = params.image_url;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KLING_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Kling API error: ${error}`);
  }

  const data = await res.json();
  return data.data.task_id;
}

export async function getKlingStatus(klingTaskId: string, isText2Video = false): Promise<{
  status: 'submitted' | 'processing' | 'succeed' | 'failed';
  videoUrl?: string;
  duration?: number;
}> {
  const KLING_KEY = await getConfig('KLING_API_KEY');
  const endpoint = isText2Video
    ? `${BASE_URL}/videos/text2video/${klingTaskId}`
    : `${BASE_URL}/videos/image2video/${klingTaskId}`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${KLING_KEY}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Kling status API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const taskData = data.data;

  return {
    status: taskData.task_status,
    videoUrl: taskData.task_result?.videos?.[0]?.url,
    duration: taskData.task_result?.videos?.[0]?.duration,
  };
}
