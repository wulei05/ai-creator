import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { CREDIT_COSTS } from '@/lib/pricing';

export interface ModelInfo {
  id: string;
  label: string;
  credits: number;
  vision?: boolean;
}

export interface ModelsResponse {
  chat: ModelInfo[];
  image: ModelInfo[];
  video: ModelInfo[];
}

const MODEL_KEY_MAP: Record<string, string> = {
  // image (fal.ai)
  'flux-schnell':           'FAL_KEY',
  'flux-dev':               'FAL_KEY',
  // chat
  'gpt-4o':              'OPENAI_API_KEY',
  'deepseek-chat':       'DEEPSEEK_API_KEY',
  'claude-sonnet-4-6':   'ANTHROPIC_API_KEY',
  'gemini-2.5-pro':      'GOOGLE_API_KEY',
  'gemini-2.5-flash':    'GOOGLE_API_KEY',
  'gemini-2.0-flash':    'GOOGLE_API_KEY',
  'gemini-2.0-flash-lite':'GOOGLE_API_KEY',
  'gemini-1.5-pro':      'GOOGLE_API_KEY',
  'gemini-1.5-flash':    'GOOGLE_API_KEY',
  'gemini-3-pro':        'GOOGLE_API_KEY',
  'gemini-3-flash':      'GOOGLE_API_KEY',
  'gemini-3.1-pro':      'GOOGLE_API_KEY',
  'gemini-3.1-flash-lite':'GOOGLE_API_KEY',
  // image
  'flux-pro':               'FAL_KEY',
  'imagen-4':               'GOOGLE_API_KEY',
  'imagen-4-ultra':         'GOOGLE_API_KEY',
  'imagen-4-fast':          'GOOGLE_API_KEY',
  'gemini-2.5-flash-image': 'GOOGLE_API_KEY',
  'gemini-3-pro-image':     'GOOGLE_API_KEY',
  'gemini-3.1-flash-image': 'GOOGLE_API_KEY',
  // video
  'kling-v2':       'KLING_API_KEY',
  'kling-v2-10s':   'KLING_API_KEY',
  'veo-3':          'GOOGLE_API_KEY',
  'veo-3-fast':     'GOOGLE_API_KEY',
};

const ALL_CHAT_MODELS: ModelInfo[] = [
  { id: 'gpt-4o',               label: 'GPT-4o',               credits: CREDIT_COSTS['gpt-4o'],               vision: true },
  { id: 'deepseek-chat',        label: 'DeepSeek Chat',        credits: CREDIT_COSTS['deepseek-chat'],        vision: false },
  { id: 'claude-sonnet-4-6',    label: 'Claude Sonnet',        credits: CREDIT_COSTS['claude-sonnet-4-6'],    vision: true },
  { id: 'gemini-3.1-pro',       label: 'Gemini 3.1 Pro',       credits: CREDIT_COSTS['gemini-3.1-pro'],       vision: true },
  { id: 'gemini-3-pro',         label: 'Gemini 3 Pro',         credits: CREDIT_COSTS['gemini-3-pro'],         vision: true },
  { id: 'gemini-3-flash',       label: 'Gemini 3 Flash',       credits: CREDIT_COSTS['gemini-3-flash'],       vision: true },
  { id: 'gemini-3.1-flash-lite',label: 'Gemini 3.1 Flash Lite',credits: CREDIT_COSTS['gemini-3.1-flash-lite'],vision: true },
  { id: 'gemini-2.5-pro',       label: 'Gemini 2.5 Pro',       credits: CREDIT_COSTS['gemini-2.5-pro'],       vision: true },
  { id: 'gemini-2.5-flash',     label: 'Gemini 2.5 Flash',     credits: CREDIT_COSTS['gemini-2.5-flash'],     vision: true },
  { id: 'gemini-2.0-flash',     label: 'Gemini 2.0 Flash',     credits: CREDIT_COSTS['gemini-2.0-flash'],     vision: true },
  { id: 'gemini-2.0-flash-lite',label: 'Gemini 2.0 Lite',      credits: CREDIT_COSTS['gemini-2.0-flash-lite'],vision: true },
  { id: 'gemini-1.5-pro',       label: 'Gemini 1.5 Pro',       credits: CREDIT_COSTS['gemini-1.5-pro'],       vision: true },
  { id: 'gemini-1.5-flash',     label: 'Gemini 1.5 Flash',     credits: CREDIT_COSTS['gemini-1.5-flash'],     vision: true },
];

const ALL_IMAGE_MODELS: ModelInfo[] = [
  { id: 'flux-schnell',           label: 'Flux Schnell',         credits: CREDIT_COSTS['flux-schnell'] },
  { id: 'flux-dev',               label: 'Flux Dev',             credits: CREDIT_COSTS['flux-dev'] },
  { id: 'flux-pro',               label: 'Flux Pro',             credits: CREDIT_COSTS['flux-pro'] },
  { id: 'imagen-4-ultra',         label: 'Imagen 4 Ultra',       credits: CREDIT_COSTS['imagen-4-ultra'] },
  { id: 'imagen-4',               label: 'Imagen 4',             credits: CREDIT_COSTS['imagen-4'] },
  { id: 'imagen-4-fast',          label: 'Imagen 4 Fast',        credits: CREDIT_COSTS['imagen-4-fast'] },
  { id: 'gemini-3-pro-image',     label: 'Gemini 3 Pro Image',   credits: CREDIT_COSTS['gemini-3-pro-image'] },
  { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Img', credits: CREDIT_COSTS['gemini-3.1-flash-image'] },
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Img', credits: CREDIT_COSTS['gemini-2.5-flash-image'] },
];

const ALL_VIDEO_MODELS: ModelInfo[] = [
  { id: 'veo-3',        label: 'Veo 3',        credits: CREDIT_COSTS['veo-3'] },
  { id: 'veo-3-fast',   label: 'Veo 3 Fast',   credits: CREDIT_COSTS['veo-3-fast'] },
  { id: 'kling-v2',     label: 'Kling v2 (5s)',  credits: CREDIT_COSTS['kling-v2'] },
  { id: 'kling-v2-10s', label: 'Kling v2 (10s)', credits: CREDIT_COSTS['kling-v2-10s'] },
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: rows } = await adminSupabase.from('app_config').select('key, value');

  const configuredKeys = new Set<string>(
    (rows ?? [])
      .filter((r: { key: string; value: string }) => r.value?.trim().length > 0)
      .map((r: { key: string }) => r.key)
  );

  const isKeyAvailable = (key: string) =>
    configuredKeys.has(key) ||
    (!!process.env[key] && !process.env[key]!.startsWith('your-'));

  const filter = (models: ModelInfo[]) =>
    models.filter((m) => isKeyAvailable(MODEL_KEY_MAP[m.id]));

  return NextResponse.json({
    chat:  filter(ALL_CHAT_MODELS),
    image: filter(ALL_IMAGE_MODELS),
    video: filter(ALL_VIDEO_MODELS),
  } satisfies ModelsResponse);
}
