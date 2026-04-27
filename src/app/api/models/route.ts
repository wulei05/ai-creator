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
  'deepseek-reasoner':   'DEEPSEEK_API_KEY',
  'qwen-max':            'QWEN_API_KEY',
  'qwen-plus':           'QWEN_API_KEY',
  'qwen-turbo':          'QWEN_API_KEY',
  'qwq-plus':            'QWEN_API_KEY',
  'glm-4-plus':          'ZHIPU_API_KEY',
  'glm-4-flash':         'ZHIPU_API_KEY',
  'glm-z1-plus':         'ZHIPU_API_KEY',
  'kimi-latest':         'MOONSHOT_API_KEY',
  'kimi-thinking-preview':'MOONSHOT_API_KEY',
  'grok-4':              'XAI_API_KEY',
  'grok-3':              'XAI_API_KEY',
  'grok-3-fast':         'XAI_API_KEY',
  'grok-3-mini':         'XAI_API_KEY',
  'grok-3-mini-fast':    'XAI_API_KEY',
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
  'grok-image':             'XAI_API_KEY',
  'flux-pro':               'FAL_KEY',
  'imagen-4':               'GOOGLE_API_KEY',
  'imagen-4-ultra':         'GOOGLE_API_KEY',
  'imagen-4-fast':          'GOOGLE_API_KEY',
  'gemini-2.5-flash-image': 'GOOGLE_API_KEY',
  'gemini-3-pro-image':     'GOOGLE_API_KEY',
  'gemini-3.1-flash-image': 'GOOGLE_API_KEY',
  // video
  'grok-video':      'XAI_API_KEY',
  'seedance-2':      'FAL_KEY',
  'seedance-2-fast': 'FAL_KEY',
  'wan-2.2':         'FAL_KEY',
  'kling-v1-6':      'KLING_API_KEY',
  'kling-v1-6-10s':  'KLING_API_KEY',
  'kling-v2':        'KLING_API_KEY',
  'kling-v2-10s':    'KLING_API_KEY',
  'kling-v2-5':      'KLING_API_KEY',
  'kling-v2-5-10s':  'KLING_API_KEY',
  'kling-v2-6':      'KLING_API_KEY',
  'kling-v2-6-10s':  'KLING_API_KEY',
  'kling-o1':        'KLING_API_KEY',
  'veo-2':          'GOOGLE_API_KEY',
  'veo-3':          'GOOGLE_API_KEY',
  'veo-3-fast':     'GOOGLE_API_KEY',
  'veo-3.1':        'GOOGLE_API_KEY',
  'veo-3.1-fast':   'GOOGLE_API_KEY',
  'veo-3.1-lite':   'GOOGLE_API_KEY',
};

const ALL_CHAT_MODELS: ModelInfo[] = [
  { id: 'gpt-4o',               label: 'GPT-4o',               credits: CREDIT_COSTS['gpt-4o'],               vision: true },
  { id: 'grok-4',               label: 'Grok 4',               credits: CREDIT_COSTS['grok-4'],               vision: true },
  { id: 'grok-3',               label: 'Grok 3',               credits: CREDIT_COSTS['grok-3'],               vision: true },
  { id: 'grok-3-fast',          label: 'Grok 3 Fast',          credits: CREDIT_COSTS['grok-3-fast'],          vision: true },
  { id: 'grok-3-mini',          label: 'Grok 3 Mini',          credits: CREDIT_COSTS['grok-3-mini'],          vision: false },
  { id: 'grok-3-mini-fast',     label: 'Grok 3 Mini Fast',     credits: CREDIT_COSTS['grok-3-mini-fast'],     vision: false },
  { id: 'deepseek-chat',        label: 'DeepSeek V3',          credits: CREDIT_COSTS['deepseek-chat'],        vision: false },
  { id: 'deepseek-reasoner',    label: 'DeepSeek R1',          credits: CREDIT_COSTS['deepseek-reasoner'],    vision: false },
  { id: 'qwen-max',             label: '通义千问 Max',          credits: CREDIT_COSTS['qwen-max'],             vision: false },
  { id: 'qwen-plus',            label: '通义千问 Plus',         credits: CREDIT_COSTS['qwen-plus'],            vision: false },
  { id: 'qwen-turbo',           label: '通义千问 Turbo',        credits: CREDIT_COSTS['qwen-turbo'],           vision: false },
  { id: 'qwq-plus',             label: 'QwQ Plus（推理）',      credits: CREDIT_COSTS['qwq-plus'],             vision: false },
  { id: 'glm-4-plus',           label: 'GLM-4 Plus',           credits: CREDIT_COSTS['glm-4-plus'],           vision: false },
  { id: 'glm-4-flash',          label: 'GLM-4 Flash',          credits: CREDIT_COSTS['glm-4-flash'],          vision: false },
  { id: 'glm-z1-plus',          label: 'GLM Z1 Plus（推理）',   credits: CREDIT_COSTS['glm-z1-plus'],          vision: false },
  { id: 'kimi-latest',          label: 'Kimi（128K）',          credits: CREDIT_COSTS['kimi-latest'],          vision: false },
  { id: 'kimi-thinking-preview',label: 'Kimi Thinking（推理）', credits: CREDIT_COSTS['kimi-thinking-preview'],vision: false },
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
  { id: 'gemini-3.1-flash-image', label: 'Nano Banana 2',        credits: CREDIT_COSTS['gemini-3.1-flash-image'] },
  { id: 'gemini-3-pro-image',     label: 'Nano Banana Pro',      credits: CREDIT_COSTS['gemini-3-pro-image'] },
  { id: 'gemini-2.5-flash-image', label: 'Nano Banana',          credits: CREDIT_COSTS['gemini-2.5-flash-image'] },
  { id: 'imagen-4-ultra',         label: 'Imagen 4 Ultra',       credits: CREDIT_COSTS['imagen-4-ultra'] },
  { id: 'imagen-4',               label: 'Imagen 4',             credits: CREDIT_COSTS['imagen-4'] },
  { id: 'imagen-4-fast',          label: 'Imagen 4 Fast',        credits: CREDIT_COSTS['imagen-4-fast'] },
  { id: 'grok-image',             label: 'Grok Image',           credits: CREDIT_COSTS['grok-image'] },
  { id: 'flux-pro',               label: 'Flux Pro',             credits: CREDIT_COSTS['flux-pro'] },
  { id: 'flux-dev',               label: 'Flux Dev',             credits: CREDIT_COSTS['flux-dev'] },
  { id: 'flux-schnell',           label: 'Flux Schnell',         credits: CREDIT_COSTS['flux-schnell'] },
];

const ALL_VIDEO_MODELS: ModelInfo[] = [
  { id: 'seedance-2',      label: 'Seedance 2.0',        credits: CREDIT_COSTS['seedance-2'] },
  { id: 'seedance-2-fast', label: 'Seedance 2.0 Fast',   credits: CREDIT_COSTS['seedance-2-fast'] },
  { id: 'wan-2.2',         label: 'Wan 2.2',             credits: CREDIT_COSTS['wan-2.2'] },
  { id: 'grok-video',      label: 'Grok Video',          credits: CREDIT_COSTS['grok-video'] },
  { id: 'veo-3.1',         label: 'Veo 3.1',             credits: CREDIT_COSTS['veo-3.1'] },
  { id: 'veo-3.1-fast',    label: 'Veo 3.1 Fast',        credits: CREDIT_COSTS['veo-3.1-fast'] },
  { id: 'veo-3.1-lite',    label: 'Veo 3.1 Lite',        credits: CREDIT_COSTS['veo-3.1-lite'] },
  { id: 'veo-3',           label: 'Veo 3',               credits: CREDIT_COSTS['veo-3'] },
  { id: 'veo-3-fast',      label: 'Veo 3 Fast',          credits: CREDIT_COSTS['veo-3-fast'] },
  { id: 'veo-2',           label: 'Veo 2',               credits: CREDIT_COSTS['veo-2'] },
  { id: 'kling-v2-6',      label: 'Kling 2.6 (5s)',      credits: CREDIT_COSTS['kling-v2-6'] },
  { id: 'kling-v2-6-10s',  label: 'Kling 2.6 (10s)',     credits: CREDIT_COSTS['kling-v2-6-10s'] },
  { id: 'kling-v2-5',      label: 'Kling 2.5 Turbo (5s)',credits: CREDIT_COSTS['kling-v2-5'] },
  { id: 'kling-v2-5-10s',  label: 'Kling 2.5 Turbo (10s)',credits: CREDIT_COSTS['kling-v2-5-10s'] },
  { id: 'kling-o1',        label: 'Kling O1',            credits: CREDIT_COSTS['kling-o1'] },
  { id: 'kling-v2',        label: 'Kling V2 (5s)',       credits: CREDIT_COSTS['kling-v2'] },
  { id: 'kling-v2-10s',    label: 'Kling V2 (10s)',      credits: CREDIT_COSTS['kling-v2-10s'] },
  { id: 'kling-v1-6',      label: 'Kling V1.6 (5s)',     credits: CREDIT_COSTS['kling-v1-6'] },
  { id: 'kling-v1-6-10s',  label: 'Kling V1.6 (10s)',    credits: CREDIT_COSTS['kling-v1-6-10s'] },
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
