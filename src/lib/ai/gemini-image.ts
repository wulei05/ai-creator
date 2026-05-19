import { GoogleGenAI } from '@google/genai';
import { getConfig } from '@/lib/config';

export const GEMINI_IMAGE_MODELS = {
  'imagen-4':               'imagen-4.0-generate-001',
  'imagen-4-ultra':         'imagen-4.0-ultra-generate-001',
  'imagen-4-fast':          'imagen-4.0-fast-generate-001',
  'gemini-2.5-flash-image': 'gemini-2.5-flash-image',
  'gemini-3-pro-image':     'gemini-3-pro-image-preview',
  'gemini-3.1-flash-image': 'gemini-3.1-flash-image-preview',
} as const;

export type GeminiImageModelId = keyof typeof GEMINI_IMAGE_MODELS;

export function isGeminiImageModel(id: string): id is GeminiImageModelId {
  return id in GEMINI_IMAGE_MODELS;
}

const IMAGEN_MODELS: GeminiImageModelId[] = ['imagen-4', 'imagen-4-ultra', 'imagen-4-fast'];

// content（generateContent）路径的 Gemini image 模型 —— 支持图片输入
export function isGeminiContentImageModel(id: string): id is GeminiImageModelId {
  return isGeminiImageModel(id) && !IMAGEN_MODELS.includes(id as GeminiImageModelId);
}

// 把 base64 data URI 解析为 { mimeType, data }
function parseDataUri(dataUri: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUri);
  if (!match) throw new Error('Invalid image data URI');
  return { mimeType: match[1], data: match[2] };
}

export async function generateGeminiImage(
  prompt: string,
  modelId: GeminiImageModelId = 'imagen-4',
  images: string[] = [],
): Promise<string> {
  const apiKey = await getConfig('GOOGLE_API_KEY');
  const modelName = GEMINI_IMAGE_MODELS[modelId];

  if (IMAGEN_MODELS.includes(modelId)) {
    if (images.length > 0) {
      throw new Error('该模型不支持参考图，请改用 Gemini image 模型');
    }
    return generateWithImagen(prompt, modelName, apiKey);
  }
  return generateWithGeminiContent(prompt, modelName, apiKey, images);
}

// ── Imagen 4 via @google/genai SDK ────────────────────────────────────────────
async function generateWithImagen(prompt: string, model: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateImages({
    model,
    prompt,
    config: { numberOfImages: 1 },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) throw new Error('Imagen did not return an image');

  if (typeof imageBytes === 'string') return imageBytes;
  return Buffer.from(imageBytes).toString('base64');
}

// ── Gemini image via generateContent with IMAGE modality ──────────────────────
async function generateWithGeminiContent(
  prompt: string,
  model: string,
  apiKey: string,
  images: string[] = [],
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = images.map((uri) => ({ inlineData: parseDataUri(uri) }));
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['IMAGE'],
    },
  });

  const respParts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of respParts) {
    if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data) {
      return part.inlineData.data as string;
    }
  }
  throw new Error('Gemini did not return an image');
}
