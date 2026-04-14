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

export async function generateGeminiImage(
  prompt: string,
  modelId: GeminiImageModelId = 'imagen-4'
): Promise<string> {
  const apiKey = await getConfig('GOOGLE_API_KEY');
  const modelName = GEMINI_IMAGE_MODELS[modelId];

  if (IMAGEN_MODELS.includes(modelId)) {
    return generateWithImagen(prompt, modelName, apiKey);
  }
  return generateWithGeminiContent(prompt, modelName, apiKey);
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
async function generateWithGeminiContent(prompt: string, model: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      // @ts-expect-error: responseModalities not yet typed
      responseModalities: ['IMAGE'],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    // @ts-expect-error: inlineData not yet typed in new SDK
    if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data) {
      // @ts-expect-error
      return part.inlineData.data as string;
    }
  }
  throw new Error('Gemini did not return an image');
}
