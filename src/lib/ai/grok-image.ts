import OpenAI from 'openai';
import { getConfig } from '@/lib/config';

// xAI image generation — OpenAI-compatible SDK
export async function generateGrokImage(
  prompt: string,
  options: { aspectRatio?: string; quality?: 'low' | 'medium' | 'high' } = {}
): Promise<string> {
  const apiKey = await getConfig('XAI_API_KEY');
  const client = new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1' });

  const response = await client.images.generate({
    model: 'grok-imagine-image',
    prompt,
    n: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(options.quality ? { quality: options.quality } as any : {}),
    response_format: 'b64_json',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error('Grok image API returned no image data');
  return b64;
}
