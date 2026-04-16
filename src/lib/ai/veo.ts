import { GoogleGenAI } from '@google/genai';
import { getConfig } from '@/lib/config';

const VEO_MODEL_MAP: Record<string, string> = {
  'veo-2':           'veo-2.0-generate-001',
  'veo-3':           'veo-3.0-generate-001',
  'veo-3-fast':      'veo-3.0-fast-generate-001',
  'veo-3.1':         'veo-3.1-generate-preview',
  'veo-3.1-fast':    'veo-3.1-fast-generate-preview',
  'veo-3.1-lite':    'veo-3.1-lite-generate-preview',
};

export type VeoModel = keyof typeof VEO_MODEL_MAP;

export function isVeoModel(id: string): id is VeoModel {
  return id in VEO_MODEL_MAP;
}

export async function createVeoVideo(params: {
  prompt: string;
  model: VeoModel;
  duration?: number;
  aspectRatio?: string;
  imageUrl?: string;
}): Promise<string> {
  const apiKey = await getConfig('GOOGLE_API_KEY');
  const client = new GoogleGenAI({ apiKey });

  const modelName = VEO_MODEL_MAP[params.model];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reqParams: any = {
    model: modelName,
    prompt: params.prompt,
    config: {
      numberOfVideos: 1,
      aspectRatio: params.aspectRatio ?? '16:9',
    },
  };

  // Attach reference image if provided
  if (params.imageUrl) {
    const imgRes = await fetch(params.imageUrl);
    const buf = await imgRes.arrayBuffer();
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg';
    reqParams.image = {
      imageBytes: Buffer.from(buf).toString('base64'),
      mimeType,
    };
  }

  const operation = await client.models.generateVideos(reqParams);

  console.log('Veo operation:', JSON.stringify({ name: operation?.name, done: (operation as never as Record<string,unknown>)?.done }));

  if (!operation?.name) {
    throw new Error('Veo API returned no operation name');
  }

  return operation.name;
}

export async function getVeoStatus(operationName: string): Promise<{
  status: 'processing' | 'completed' | 'failed';
  videoUrl?: string;
}> {
  const apiKey = await getConfig('GOOGLE_API_KEY');

  // Poll via REST — operationName is like "operations/xxxx" or a full path
  const name = operationName.startsWith('operations/')
    ? operationName
    : operationName;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${name}?key=${apiKey}`,
    { signal: AbortSignal.timeout(10_000) },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Veo status error ${res.status}: ${body}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const op: any = await res.json();

  if (!op.done) {
    return { status: 'processing' };
  }

  if (op.error) {
    console.error('Veo operation error:', op.error);
    return { status: 'failed' };
  }

  const videoResp = op.response?.generateVideoResponse ?? op.response ?? {};

  // RAI safety filter
  if (videoResp.raiMediaFilteredCount > 0) {
    const reasons: string[] = videoResp.raiMediaFilteredReasons ?? [];
    const msg = reasons[0] ?? 'Content filtered by safety policy';
    throw new Error(`Safety filter: ${msg}`);
  }

  // Success — SDK uses generatedSamples, fall back to generatedVideos
  const samples: unknown[] =
    videoResp.generatedSamples ??
    videoResp.generatedVideos ??
    videoResp.videos ??
    [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videoUrl: string | undefined = (samples[0] as any)?.video?.uri ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (samples[0] as any)?.videoUri;

  if (!videoUrl) {
    console.error('Veo op done but no video URL:', JSON.stringify(op.response));
    return { status: 'failed' };
  }

  return { status: 'completed', videoUrl };
}
