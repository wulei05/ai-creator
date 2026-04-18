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

const FAL_MODEL_ENDPOINTS: Record<string, string> = {
  'flux-schnell': 'fal-ai/flux/schnell',
  'flux-dev':     'fal-ai/flux/dev',
  'flux-pro':     'fal-ai/flux-pro/v1.1',
};

export async function submitFluxImage(params: {
  prompt: string;
  aspect_ratio: string;
  model?: string;
}): Promise<string> {
  fal.config({ credentials: await getConfig('FAL_KEY') });
  const endpoint = FAL_MODEL_ENDPOINTS[params.model ?? 'flux-pro'] ?? FAL_MODEL_ENDPOINTS['flux-pro'];
  const result = await fal.queue.submit(endpoint, {
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

// ── Inpaint (stable-diffusion inpainting — free tier) ────────
const INPAINT_ENDPOINT = 'fal-ai/stable-diffusion-inpainting';

/** Upload a base64 data URI to fal storage and return the CDN URL */
async function uploadDataUri(dataUri: string): Promise<string> {
  const [header, b64] = dataUri.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const ext  = mime.split('/')[1] ?? 'jpg';
  const buf  = Buffer.from(b64, 'base64');
  const file = new File([buf], `upload.${ext}`, { type: mime });
  return fal.storage.upload(file);
}

export async function submitInpaint(params: {
  image_url: string;
  mask_url: string;
  prompt: string;
}): Promise<string> {
  fal.config({ credentials: await getConfig('FAL_KEY') });
  const [imageUrl, maskUrl] = await Promise.all([
    uploadDataUri(params.image_url),
    uploadDataUri(params.mask_url),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await fal.queue.submit(INPAINT_ENDPOINT, {
    input: {
      image_url: imageUrl,
      mask_url: maskUrl,
      prompt: params.prompt,
    } as any,
  });
  return result.request_id;
}

export async function pollInpaintResult(requestId: string): Promise<string | null> {
  fal.config({ credentials: await getConfig('FAL_KEY') });
  for (let i = 0; i < 45; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await fal.queue.status(INPAINT_ENDPOINT, { requestId, logs: false });
    const s = (status as { status: string }).status;
    if (s === 'COMPLETED') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await fal.queue.result(INPAINT_ENDPOINT, { requestId }) as any;
      return result.data?.images?.[0]?.url ?? result.data?.image?.url ?? null;
    }
    if (s === 'FAILED') return null;
  }
  return null;
}

// ── Outpaint ─────────────────────────────────────────────────
const OUTPAINT_ENDPOINT = 'fal-ai/image-apps-v2/outpaint';

export async function submitOutpaint(params: {
  image_url: string;
  prompt?: string;
  expand_left?: number;
  expand_right?: number;
  expand_top?: number;
  expand_bottom?: number;
}): Promise<string> {
  fal.config({ credentials: await getConfig('FAL_KEY') });
  const imageUrl = await uploadDataUri(params.image_url);
  const result = await fal.queue.submit(OUTPAINT_ENDPOINT, {
    input: {
      image_url: imageUrl,
      prompt: params.prompt ?? '',
      expand_left:   params.expand_left   ?? 256,
      expand_right:  params.expand_right  ?? 256,
      expand_top:    params.expand_top    ?? 0,
      expand_bottom: params.expand_bottom ?? 0,
    },
  });
  return result.request_id;
}

export async function pollOutpaintResult(requestId: string): Promise<string | null> {
  fal.config({ credentials: await getConfig('FAL_KEY') });
  for (let i = 0; i < 45; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await fal.queue.status(OUTPAINT_ENDPOINT, { requestId, logs: false });
    const s = (status as { status: string }).status;
    if (s === 'COMPLETED') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await fal.queue.result(OUTPAINT_ENDPOINT, { requestId }) as any;
      return result.data?.images?.[0]?.url ?? null;
    }
    if (s === 'FAILED') return null;
  }
  return null;
}
