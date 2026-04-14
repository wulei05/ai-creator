import { fal } from '@fal-ai/client';
import { getConfig } from '@/lib/config';

type FluxImageSize =
  | 'square_hd'
  | 'square'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9';

function aspectRatioToImageSize(aspectRatio: string): FluxImageSize {
  const map: Record<string, FluxImageSize> = {
    '1:1': 'square_hd',
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9',
    '4:3': 'landscape_4_3',
    '3:4': 'portrait_4_3',
  };
  return map[aspectRatio] ?? 'square_hd';
}

export async function submitFluxImage(params: {
  prompt: string;
  aspect_ratio: string;
}): Promise<string> {
  fal.config({ credentials: await getConfig('FAL_KEY') });
  const result = await fal.queue.submit('fal-ai/flux-pro/v1.1', {
    input: {
      prompt: params.prompt,
      image_size: aspectRatioToImageSize(params.aspect_ratio),
      num_images: 1,
      output_format: 'jpeg',
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_URL}/api/ai/image/webhook`,
  });
  return result.request_id;
}

export async function getFluxStatus(requestId: string) {
  return fal.queue.status('fal-ai/flux-pro/v1.1', {
    requestId,
    logs: false,
  });
}

export async function getFluxResult(requestId: string) {
  return fal.queue.result('fal-ai/flux-pro/v1.1', { requestId });
}
