import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CREDIT_COSTS } from '@/lib/pricing';
import { createKlingVideo, type KlingModel } from '@/lib/ai/kling';
import { createVeoVideo, isVeoModel, type VeoModel } from '@/lib/ai/veo';
import { createGrokVideo } from '@/lib/ai/grok-video';
import { submitFalVideo, isFalVideoModel } from '@/lib/ai/fal-video';
import { videoRateLimit } from '@/lib/ratelimit';

const KLING_MODELS      = ['kling-v1-6', 'kling-v1-6-10s', 'kling-v2', 'kling-v2-10s', 'kling-v2-5', 'kling-v2-5-10s', 'kling-v2-6', 'kling-v2-6-10s', 'kling-o1'] as const;
const VEO_MODELS        = ['veo-2', 'veo-3', 'veo-3-fast', 'veo-3.1', 'veo-3.1-fast', 'veo-3.1-lite'] as const;
const GROK_VIDEO_MODELS = ['grok-video'] as const;
const FAL_VIDEO_MODELS  = ['seedance-2', 'seedance-2-fast', 'wan-2.2'] as const;
const ALL_VIDEO_MODELS  = [...KLING_MODELS, ...VEO_MODELS, ...GROK_VIDEO_MODELS, ...FAL_VIDEO_MODELS] as const;
type VideoModel = typeof ALL_VIDEO_MODELS[number];

function isSafeImageUrl(rawUrl: string): boolean {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  const h = url.hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false;
  if (/^169\.254\./.test(h)) return false;
  if (/^10\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^192\.168\./.test(h)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success, limit, remaining, reset } = await videoRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      }},
    );
  }

  let body: { prompt?: string; image_url?: string; duration?: 5 | 10; aspect_ratio?: string; model?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { prompt, image_url, duration = 5, aspect_ratio = '16:9' } = body;
  const model: VideoModel = ALL_VIDEO_MODELS.includes(body.model as VideoModel)
    ? (body.model as VideoModel)
    : 'veo-3-fast';

  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  if (prompt.length > 1000) return NextResponse.json({ error: 'Prompt must be 1000 characters or less' }, { status: 400 });
  if (image_url && !isSafeImageUrl(image_url)) return NextResponse.json({ error: 'image_url must be a valid https URL' }, { status: 400 });

  // Resolve credit cost (strip -10s suffix for lookup if needed)
  const costKey = (model in CREDIT_COSTS) ? model : 'veo-3-fast';
  const credits_cost = CREDIT_COSTS[costKey as keyof typeof CREDIT_COSTS] ?? CREDIT_COSTS['veo-3-fast'];

  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert({ user_id: user.id, type: 'video', model, prompt: prompt.trim(), status: 'pending', credits_cost })
    .select('id').single();

  if (insertError || !task) return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });

  const task_id = task.id;

  const { data: deducted, error: deductError } = await supabase.rpc('deduct_credits', {
    p_user_id: user.id, p_amount: credits_cost, p_task_id: task_id, p_desc: '视频生成',
  });

  if (deductError || !deducted) {
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  let upstream_id: string;

  try {
    if (isFalVideoModel(model)) {
      // ── fal.ai (Seedance / Wan) ──────────────────────
      upstream_id = await submitFalVideo({
        model,
        prompt: prompt.trim(),
        duration: duration ?? 5,
        aspectRatio: aspect_ratio,
        imageUrl: image_url,
      });
    } else if (model === 'grok-video') {
      // ── Grok Video (xAI) ─────────────────────────────
      upstream_id = await createGrokVideo({
        prompt: prompt.trim(),
        duration: duration === 10 ? 15 : 8,
        resolution: '720p',
        aspectRatio: aspect_ratio,
        imageUrl: image_url,
      });
    } else if (isVeoModel(model)) {
      // ── Veo 3 (Google) ──────────────────────────────
      upstream_id = await createVeoVideo({
        prompt: prompt.trim(),
        model: model as VeoModel,
        duration: duration === 10 ? 8 : 5, // Veo supports up to 8s
        aspectRatio: aspect_ratio,
        imageUrl: image_url,
      });
    } else {
      // ── Kling ────────────────────────────────────────
      upstream_id = await createKlingVideo({
        prompt: prompt.trim(),
        image_url: image_url ?? undefined,
        duration: duration ?? 5,
        aspect_ratio: aspect_ratio ?? '16:9',
        model: model as KlingModel,
      });
    }
  } catch (err) {
    const label = isFalVideoModel(model) ? 'fal.ai' : model === 'grok-video' ? 'Grok' : isVeoModel(model) ? 'Veo' : 'Kling';
    console.error(`${label} submit error:`, err);
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    await supabase.rpc('refund_credits', { p_user_id: user.id, p_amount: credits_cost, p_task_id: task_id });
    const msg = err instanceof Error ? err.message : 'Failed to submit video generation';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ upstream_id, status: 'processing' })
    .eq('id', task_id);

  if (updateError) {
    await supabase.rpc('refund_credits', { p_user_id: user.id, p_amount: credits_cost, p_task_id: task_id });
    await supabase.from('tasks').update({ status: 'failed' }).eq('id', task_id);
    return NextResponse.json({ error: 'Failed to record task' }, { status: 500 });
  }

  return NextResponse.json({ task_id, credits_cost, status: 'pending' });
}
