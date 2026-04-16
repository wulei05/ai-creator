import { fal } from '@fal-ai/client';
import { getConfig } from '@/lib/config';

// fal.ai video model → endpoint mapping
export const FAL_VIDEO_ENDPOINTS: Record<string, string> = {
  'seedance-2':       'bytedance/seedance-2.0/text-to-video',
  'seedance-2-fast':  'bytedance/seedance-2.0/fast/text-to-video',
  'wan-2.2':          'fal-ai/wan/v2.2/text-to-video',
};

export function isFalVideoModel(model: string): boolean {
  return model in FAL_VIDEO_ENDPOINTS;
}

function aspectRatioToStr(ar: string): string {
  // fal.ai accepts "16:9", "9:16", "1:1" directly
  return ar;
}

export async function submitFalVideo(params: {
  model: string;
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  imageUrl?: string;
}): Promise<string> {
  fal.config({ credentials: await getConfig('FAL_KEY') });

  const endpoint = FAL_VIDEO_ENDPOINTS[params.model];
  if (!endpoint) throw new Error(`Unknown fal.ai video model: ${params.model}`);

  const input: Record<string, unknown> = {
    prompt: params.prompt,
    duration: params.duration ?? 5,
    aspect_ratio: aspectRatioToStr(params.aspectRatio ?? '16:9'),
  };
  if (params.imageUrl) input.image_url = params.imageUrl;

  const result = await fal.queue.submit(endpoint, { input });
  // Encode endpoint into upstream_id so status route can reconstruct it
  return `${endpoint}::${result.request_id}`;
}

export async function getFalVideoStatus(upstreamId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
}> {
  fal.config({ credentials: await getConfig('FAL_KEY') });

  const [endpoint, requestId] = upstreamId.split('::');
  if (!endpoint || !requestId) throw new Error('Invalid fal video upstream_id');

  const status = await fal.queue.status(endpoint, { requestId, logs: false });

  const s = status.status as string;
  if (s === 'COMPLETED') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await fal.queue.result(endpoint, { requestId }) as any;
    const videoUrl: string | undefined =
      result.data?.video?.url ??
      result.data?.video_url ??
      result.data?.videos?.[0]?.url;
    return { status: 'completed', videoUrl };
  }
  if (s === 'FAILED') return { status: 'failed' };
  if (s === 'IN_PROGRESS') return { status: 'processing' };
  return { status: 'pending' };
}
